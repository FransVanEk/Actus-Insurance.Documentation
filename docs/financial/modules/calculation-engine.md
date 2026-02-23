# Calculation Engine

This document explains the GPU calculation engine: inputs, outputs, formulas, algorithms, invariants, rounding, and timing logic.

See also: [Contracts](./contracts.md) | [Risk Factors](./risk-factors.md) | [Architecture](../architecture.md)

---

## Business View

### What the Calculation Engine Does

The calculation engine is the core of the system. It takes a portfolio of contracts and a set of market rates, and computes — for every contract, every event, and every scenario — the exact cash flows and state values that the ACTUS standard prescribes.

The engine uses the GPU to perform thousands of these calculations simultaneously. Each contract is assigned its own computational unit (GPU thread) so all contracts are processed at the same time.

### Why This Matters

Without a correct and fast calculation engine, the system produces no value. The engine must be:

- **Correct** — Results must match the ACTUS standard test suite exactly.
- **Fast** — Results for large portfolios must arrive in time for intra-day reporting.
- **Deterministic** — The same inputs must always produce the same outputs.

### Risks If It Fails

- Incorrect formulas produce wrong payoffs → incorrect P&L and risk figures.
- Floating-point non-determinism → results that differ between runs → audit failures.
- Integer overflow for large date ranges → incorrect year fractions → wrong interest payments.

---

## Technical View

### Inputs

| Input | Type | Description |
|---|---|---|
| `contracts` | `ArrayView1D<PamContractGpu>` | Contract terms + initial state + event slice indices |
| `events` | `ArrayView1D<PamEventGpu>` | Flat array of all events for all contracts |
| `rates` | `ArrayView1D<GpuMarketRate>` | Base market rates (single-scenario kernel) |
| `scenarioRates` | `ArrayView1D<GpuScenarioRate>` | Prior + after rates per scenario (multi-scenario kernels) |
| `index` | `Index1D` or `Index2D` | GPU thread index |

### Outputs

| Kernel | Output | Type |
|---|---|---|
| `PamGpuKernel` | Per-event results | `PamEventResultGpu[]` |
| `ScenarioBatchKernel` | Per-contract-scenario outcome | `ScenarioOutcome[]` |
| `PayoffCubeKernel` | Payoff by calc-date, contract, scenario, time | `double[]` (4D flat) |

### Year Fraction Formulas

All interest accrual requires a year fraction computed between two dates. The kernel implements five conventions:

| Code | Formula |
|---|---|
| `A365` | `(endTicks - startTicks) / TicksPerDay / 365.0` |
| `A360` | `(endTicks - startTicks) / TicksPerDay / 360.0` |
| `E30_360` | `(360*(y2-y1) + 30*(m2-m1) + (min(d2,30) - min(d1,30))) / 360.0` |
| `A336` | `(endTicks - startTicks) / TicksPerDay / 336.0` |
| `AA` (Actual/Actual ISDA) | Multi-year: first partial year + full years + last partial year |
| Default (unknown code) | Falls back to A365 |

`TicksPerDay = 864_000_000_000L` (100-nanosecond ticks per day).

Source: `src/ActusInsurance.GPU/PamGpuKernel.cs` — `ComputeYearFraction()`

### Actual/Actual ISDA Detail

For dates in the same year:
```
yf = (endTicks - startTicks) / TicksPerDay / basis
```
where `basis = 366` for leap years, `365` otherwise.

For dates spanning multiple years:
```
yf = (daysRemainingInStartYear / basisY1)
   + (fullYearsBetween)
   + (dayOfYearInEndYear / basisY2)
```

Source: `src/ActusInsurance.GPU/PamGpuKernel.cs` — `ComputeActualActualISDA()`

### Rounding Logic

The kernel does **not** round payoffs or state variables during computation. Rounding is applied only at the test comparison level:

```csharp
// From PamTestsGpu.cs
double rounded = Math.Round(actual, 10);
```

The tests allow a tolerance of `2e-10` (two units at 10 decimal places).

### Timing Logic — RoundToFullHours

Before computing year fractions, both `prevCalcTimeTicks` and `ev.CalcTimeTicks` are rounded to the nearest full hour:

```csharp
private static long RoundToFullHours(long ticks)
{
    long hourTicks = (ticks / TicksPerHour) * TicksPerHour;
    long remainder = ticks - hourTicks;
    long halfHour  = TicksPerHour / 2;
    return remainder < halfHour ? hourTicks : hourTicks + TicksPerHour;
}
```

`TicksPerHour = 36_000_000_000L`.

This prevents sub-hour differences (from business day adjustments) from producing non-zero year fractions.

### Accrual Logic

Accrual is computed before the state transition for event types: `IP`, `IPCI`, `RR`, `RRF`, `FP`, `SC`.

```csharp
if (NeedsAccrual(evType))
{
    if (yf > 0.0 && notionalPrincipal != 0.0)
    {
        if (nominalInterestRate != 0.0)
            accruedInterest += nominalInterestRate * notionalPrincipal * yf;

        if (c.FeeRate != 0.0 && c.FeeBasisN == 1)
            feeAccrued += c.FeeRate * notionalPrincipal * yf;
    }
}
```

### State Transitions

After payoff computation and accrual, the kernel applies state transitions:

| Event | State Transition |
|---|---|
| IED | `notionalPrincipal = roleSign * NotionalPrincipal`; `nominalInterestRate = NominalInterestRate` |
| MD | `notionalPrincipal = 0`; `accruedInterest = 0` |
| TD | `notionalPrincipal = 0`; `accruedInterest = 0` |
| IP | `accruedInterest = 0` |
| IPCI | `notionalPrincipal += accruedInterest`; `accruedInterest = 0` |
| RR | `nominalInterestRate = lookedUpRate * rateMultiplier + rateSpread` |
| RRF | If `hasNextResetRate == 1`: `nominalInterestRate = nextResetRate` |
| FP | `feeAccrued = 0` |
| SC | `notionalScalingMultiplier = (lookedUpRate / scalingIndexAtContractDealDate) * NotionalScalingMultiplier` (if base != 0) |

Source: `src/ActusInsurance.GPU/PamGpuKernel.cs` lines 116–171

### Prior / After Rate Selection (Scenario Kernels)

In `ScenarioBatchKernel` and `PayoffCubeKernel`, the rate at each event is selected based on whether the event's `ScheduleTimeTicks` is before the calculation date:

```csharp
lookedUpRate = ev.ScheduleTimeTicks < calculationDateTicks
    ? sr.PriorRate
    : sr.AfterRate;
```

Events strictly before the calculation date use the prior (historical) rate. Events on or after use the projected (after) rate.

Source: `src/ActusInsurance.GPU/ScenarioBatchKernel.cs` line 59

### PayoffCube — Payoff Binning

The `PayoffCubeKernel` places each event's payoff into the time-grid slot matching its `ScheduleTimeTicks`:

```csharp
for (int t = 0; t < timeGridLength; t++)
{
    if (timeGrid[t] == ev.ScheduleTimeTicks)
    {
        payoffCube[cubeBase + t] += payoff;
        break;
    }
}
```

Events not matching any time-grid slot are silently discarded. The flat index formula is:

```
cubeBase = ((calcDateIndex * numContracts + c) * numScenarios + s) * timeGridLength
```

Source: `src/ActusInsurance.GPU/Sinks/PayoffCubeKernel.cs` lines 99–108

### Algorithm Invariants

1. The kernel always writes one `PamEventResultGpu` per event, even if payoff = 0.
2. `prevCalcTimeTicks` is updated at the end of every event iteration.
3. Year fraction is only computed if `prevCalcTimeTicks < ev.CalcTimeTicks` (no negative accrual).
4. If `notionalPrincipal == 0`, accrual updates are skipped (avoids multiplying by zero principal).
5. The kernel does not branch on GPU thread boundaries — all threads follow the same control flow path for correctness on GPU.

### Date Arithmetic — TicksToDate

The kernel implements its own `TicksToDate()` function (not using .NET `DateTime`) because GPU kernels cannot call managed runtime methods. The algorithm uses the proleptic Gregorian calendar via 400-year, 100-year, 4-year, and 1-year period decomposition.

Source: `src/ActusInsurance.GPU/PamGpuKernel.cs` — `TicksToDate()`

### Three Kernels — Shared Logic

All three kernels (`PamGpuKernel`, `ScenarioBatchKernel`, `PayoffCubeKernel`) implement the same payoff and state-transition logic. They differ in:

- **Input**: `GpuMarketRate[]` vs `GpuScenarioRate[]` vs `GpuScenarioRate[] + timeGrid[]`
- **Output**: `PamEventResultGpu[]` vs `ScenarioOutcome[]` vs `double[]` (4D cube)
- **Index**: `Index1D` vs `Index2D`

The duplication is intentional for GPU performance — static method calls in ILGPU kernels are inlined at JIT time.

### Evidence from Code

- `src/ActusInsurance.GPU/PamGpuKernel.cs`
- `src/ActusInsurance.GPU/ScenarioBatchKernel.cs`
- `src/ActusInsurance.GPU/Sinks/PayoffCubeKernel.cs`
- `src/ActusInsurance.Tests.GPU/PamTestsGpu.cs`
- `src/ActusInsurance.Tests.GPU/PayoffCubeTests.cs`
