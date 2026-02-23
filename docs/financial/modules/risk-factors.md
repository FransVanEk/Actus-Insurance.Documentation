# Risk Factors Module

This document explains what risk factors are, where they come from, how they are applied, and what safety mechanisms exist.

See also: [Domain Model](../domain-model.md) | [Calculation Engine](./calculation-engine.md) | [Contracts](./contracts.md)

---

## Business View

### What Risk Factors Are

A **risk factor** is an external market value — typically an interest rate or an index — that can change the future cash flows of a contract. For example:

- The **EURIBOR 3M** rate determines how the interest rate on a floating-rate loan resets every three months.
- A **scaling index** determines how the principal of a contract grows over time.

Without risk factors, floating-rate contracts cannot be calculated beyond their current rate. Risk factors represent the best available estimate (or a range of estimates) of how market conditions will evolve.

### Prior and After Rates

For valuations as of a specific calculation date, there are two versions of every risk factor:

- **Prior rate** — The rate as it was historically (before the calculation date). Used for events that have already occurred.
- **After rate** — The projected rate going forward (on or after the calculation date). Used for events in the future.

This distinction is critical for correct IFRS 17 and Solvency II valuations.

### Monte Carlo Scenarios

A **Monte Carlo analysis** generates hundreds or thousands of different possible future rate paths (scenarios). The system uses log-normal perturbation of base rates, driven by a deterministic random number generator. Using the same seed always produces the same scenarios, making results reproducible.

### Fallback Logic

If a market rate is not available for a specific event time, the system falls back to the closest earlier rate. If no earlier rate exists, the rate defaults to zero.

---

## Technical View

### Risk Factor Definition

Risk factors are defined through the `RiskFactorModel` class (from `ActusInsurance.Core.CPU`). The adapter uses `riskFactors.GetRate(marketObjectCode, eventTime)` to look up the base rate for each event.

In tests and example code, rates are added as:

```csharp
riskFactors.AddRate(moc, date, value);       // Point-in-time rate
riskFactors.AddConstantRate(moc, value);     // Constant rate for all times
```

Source: `src/ActusInsurance.Tests.GPU/ScenarioTests.cs`

### How Risk Factors Are Applied

During the adapter packing phase (`PamV3Adapter.ConvertCore()`), each `RR` (rate reset) or `SC` (scaling) event that references a market object code gets:

1. A lookup of the base rate from `RiskFactorModel`.
2. A `GpuMarketRate` entry added to the flat rates array.
3. A `RateSlotInfo` entry recording the market object code and event time.
4. A `RateIndex` written into the `PamEventGpu` struct.

```csharp
if (ev.Type == EventType.RR && !string.IsNullOrEmpty(terms.MarketObjectCodeOfRateReset))
{
    rateIndex = allRates.Count;
    allRates.Add(new GpuMarketRate
    {
        Rate = riskFactors.GetRate(terms.MarketObjectCodeOfRateReset, ev.Time)
    });
    rateSlotInfoOut?.Add(new RateSlotInfo(terms.MarketObjectCodeOfRateReset!, ev.Time.Ticks));
}
```

Source: `src/ActusInsurance.GPU/PamV3Adapter.cs` lines 128–150

### Rate Index in GPU Structs

The `PamEventGpu.RateIndex` field:

- `-1` — No rate lookup needed for this event.
- `>= 0` — Index into the flat `GpuMarketRate[]` (single-scenario kernel) or `GpuScenarioRate[]` (scenario kernels).

```csharp
// In PamGpuKernel:
double lookedUpRate = 0.0;
if (ev.RateIndex >= 0)
    lookedUpRate = rates[ev.RateIndex].Rate;
```

### Scenario Rate Buffer Layout

For scenario kernels, the flat `GpuScenarioRate[]` buffer has dimensions `[numScenarios × numBaseRateSlots]`:

```
scenarioRates[scenarioIndex * numBaseRateSlots + rateSlotIndex]
```

Each scenario holds one `GpuScenarioRate` (prior + after) for every rate slot identified during packing.

### Prior/After Selection Rule

```csharp
lookedUpRate = ev.ScheduleTimeTicks < calculationDateTicks
    ? sr.PriorRate
    : sr.AfterRate;
```

Events strictly before the calculation date use the prior rate. Events on the calculation date or after use the after rate.

Source: `src/ActusInsurance.GPU/ScenarioBatchKernel.cs` line 59

### RR State Transition

After selecting the looked-up rate, the rate reset state transition applies:

```csharp
// RR: variable rate reset
double newRate = lookedUpRate * contract.RateMultiplier + contract.RateSpread;
nominalInterestRate = newRate;

// RRF: fixed rate (pre-agreed next reset)
if (contract.HasNextResetRate == 1)
    nominalInterestRate = contract.NextResetRate;
```

`RateMultiplier` and `RateSpread` allow linear transformations of the market rate (e.g., `rate * 1.0 + 0.005` for a 50-basis-point spread).

Source: `src/ActusInsurance.GPU/PamGpuKernel.cs` lines 142–151

### Scaling (SC) State Transition

```csharp
if (contract.ScalingIndexAtContractDealDate != 0.0)
{
    double sf = lookedUpRate / contract.ScalingIndexAtContractDealDate;
    notionalScalingMultiplier = sf * contract.NotionalScalingMultiplier;
    interestScalingMultiplier = sf * contract.InterestScalingMultiplier;
}
```

The scaling factor `sf` is the ratio of the current index value to the index value at the contract deal date. If the base index is zero, the transition is skipped (divide-by-zero guard).

Source: `src/ActusInsurance.GPU/PamGpuKernel.cs` lines 159–167

### Monte Carlo Scenario Generator

`MonteCarloScenarioGenerator.Generate()` creates a `ScenarioSet` of log-normally perturbed rate scenarios.

**Algorithm:**

1. For each scenario `s` in `[0, numScenarios)`:
   - For each market object code:
     - For each time key in the base rate series:
       - `prior = basePriorRates[moc][t]` (deterministic, unperturbed)
       - `z = NextNormal(ref state)` (Box-Muller via XorShift64)
       - `after = baseAfter * exp(volatility * z)`
       - If `volatility == 0` or `baseAfter == 0`: `after = baseAfter` (no perturbation)

**PRNG — XorShift64:**

```csharp
private static ulong NextUInt64(ref ulong state)
{
    state ^= state << 13;
    state ^= state >> 7;
    state ^= state << 17;
    return state;
}
```

The state must be non-zero (initialised to `1` if `seed == 0`).

**Box-Muller normal variate:**

```csharp
double z = Math.Sqrt(-2.0 * Math.Log(u1)) * Math.Cos(2.0 * Math.PI * u2);
```

`u1` is clamped to `1e-300` to avoid `log(0)`.

**Reproducibility guarantee**: The same seed always produces the same scenarios. Different seeds produce different scenarios (probabilistically). This is validated by the tests in `ScenarioTests.cs`.

Source: `src/ActusInsurance.GPU/Models/MonteCarloScenarioGenerator.cs`

### ScenarioRateSeries Fallback Logic

Rate lookup in a `ScenarioRateSeries` uses floor interpolation:

```csharp
// Exact match first
if (_data.TryGetValue(timeTicks, out var exact))
    return exact;

// Closest earlier entry
(double prior, double after) best = (0.0, 0.0);
foreach (var kvp in _data)
{
    if (kvp.Key > timeTicks) break;
    best = kvp.Value;
}
return best;
```

If `timeTicks` is before all entries, `(0.0, 0.0)` is returned.

Source: `src/ActusInsurance.GPU/Models/ScenarioSet.cs`

### Limits and Safety Checks

| Check | Location | Description |
|---|---|---|
| `ScalingIndexAtContractDealDate != 0` | `PamGpuKernel.cs` | Prevents divide-by-zero in SC events |
| `u1 < 1e-300 → 1e-300` | `MonteCarloScenarioGenerator.cs` | Prevents `log(0)` in Box-Muller |
| `seed == 0 → seed = 1` | `MonteCarloScenarioGenerator.cs` | XorShift64 requires non-zero state |
| `numScenarios <= 0` | `MonteCarloScenarioGenerator.cs` | Throws `ArgumentOutOfRangeException` |
| `ev.RateIndex >= 0` guard | All kernels | Only looks up rates when explicitly assigned |

### Evidence from Code

- `src/ActusInsurance.GPU/PamV3Adapter.cs`
- `src/ActusInsurance.GPU/PamGpuKernel.cs`
- `src/ActusInsurance.GPU/ScenarioBatchKernel.cs`
- `src/ActusInsurance.GPU/Sinks/PayoffCubeKernel.cs`
- `src/ActusInsurance.GPU/Models/MonteCarloScenarioGenerator.cs`
- `src/ActusInsurance.GPU/Models/ScenarioSet.cs`
- `src/ActusInsurance.Tests.GPU/ScenarioTests.cs`
