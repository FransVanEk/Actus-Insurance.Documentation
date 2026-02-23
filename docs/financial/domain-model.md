# Domain Model

This document defines the core financial and technical concepts used throughout **Actus-Insurance.GPU**.

See also: [Contracts](./modules/contracts.md) | [Calculation Engine](./modules/calculation-engine.md) | [Risk Factors](./modules/risk-factors.md)

---

## Business View

### Key Financial Concepts

**ACTUS** (Algorithmic Contract Types Unified Standards) is an open international standard that defines precise mathematical rules for every type of financial contract. All calculations in this system follow the ACTUS standard.

**Contract** — A legally binding agreement between two parties (e.g., a loan or bond). In ACTUS, every contract is described by a fixed set of terms (interest rate, principal amount, payment dates, etc.).

**PAM — Principal At Maturity** — The contract type currently implemented. A PAM contract pays interest periodically and returns the full principal at the end (maturity date). This models standard fixed-income bonds and bullet loans.

**Event** — A scheduled financial action on a contract. Examples: paying interest (IP), exchanging principal (IED), resetting the interest rate (RR), returning the principal (MD).

**Payoff** — The cash amount associated with an event. A positive payoff means money received; a negative payoff means money paid.

**Notional Principal** — The face value of a contract (e.g., €1,000,000). Interest is calculated on this amount.

**Risk Factor / Market Rate** — An external interest rate or index value (e.g., EURIBOR 3M) that affects the contract's future cash flows.

**Scenario** — A complete set of market rate values used to calculate future cash flows. Monte Carlo analysis uses many scenarios.

**Calculation Date** — The date as of which the portfolio is valued. Events before this date use historical (prior) rates; events after use projected (after) rates.

---

## Technical View

### Core Data Structures

#### PamContractGpu

The GPU representation of a PAM contract. All fields are primitive types for GPU compatibility.

```csharp
[StructLayout(LayoutKind.Sequential)]
public struct PamContractGpu
{
    // Key dates (as DateTime.Ticks)
    public long InitialExchangeDateTicks;
    public long StatusDateTicks;
    public long MaturityDateTicks;
    public long PurchaseDateTicks;
    public long TerminationDateTicks;

    // Principal and rates
    public double NotionalPrincipal;
    public double NominalInterestRate;
    public double AccruedInterest;
    public double PremiumDiscountAtIED;
    public double PriceAtPurchaseDate;
    public double PriceAtTerminationDate;

    // Rate reset terms
    public double RateSpread;
    public double RateMultiplier;
    public double NextResetRate;
    public int HasNextResetRate;        // 0 or 1

    // Fee terms
    public double FeeRate;
    public double FeeAccrued;
    public int FeeBasisN;               // 0 = absolute, 1 = notional-based

    // Scaling multipliers (from contract terms)
    public double NotionalScalingMultiplier;
    public double InterestScalingMultiplier;
    public double ScalingIndexAtContractDealDate;

    // Conventions
    public int DayCountConventionCode;  // See GpuDayCountCode
    public int RoleSign;                // +1 = lender, -1 = borrower

    // Event slice (into the shared flat events array)
    public int EventOffset;
    public int EventCount;

    // Market rate slice (into the shared flat rates array)
    public int MarketRateOffset;
    public int MarketRateCount;

    // Mutable initial state (copied from contract terms after initialisation)
    public double InitialStateNotionalPrincipal;
    public double InitialStateNominalInterestRate;
    public double InitialStateAccruedInterest;
    public double InitialStateFeeAccrued;
    public double InitialStateNotionalScalingMultiplier;
    public double InitialStateInterestScalingMultiplier;
    public long InitialCalcTimeTicks;
}
```

Source: `src/ActusInsurance.GPU/Models/PamContractGpu.cs`

#### PamEventGpu

A single scheduled event for a contract.

```csharp
[StructLayout(LayoutKind.Sequential)]
public struct PamEventGpu
{
    public long ScheduleTimeTicks; // When it is scheduled (unadjusted)
    public long EventTimeTicks;    // Effective event time (after business day adjustment)
    public long CalcTimeTicks;     // Time used for accrual calculation
    public int  EventType;         // GpuEventType constant
    public int  RateIndex;         // Index into GpuMarketRate[] (-1 = no rate)
}
```

Source: `src/ActusInsurance.GPU/Models/PamEventGpu.cs`

#### PamEventResultGpu

The output of the kernel for a single event.

```csharp
[StructLayout(LayoutKind.Sequential)]
public struct PamEventResultGpu
{
    public long   ScheduleTimeTicks;
    public long   EventTimeTicks;
    public double Payoff;
    public double NotionalPrincipal;
    public double NominalInterestRate;
    public double AccruedInterest;
    public double FeeAccrued;
    public int    EventType;
}
```

Source: `src/ActusInsurance.GPU/Models/PamEventResultGpu.cs`

#### GpuMarketRate

A single market rate value, used by the single-scenario kernel.

```csharp
[StructLayout(LayoutKind.Sequential)]
public struct GpuMarketRate { public double Rate; }
```

#### GpuScenarioRate

Prior and after rates for a single rate slot in a scenario.

```csharp
[StructLayout(LayoutKind.Sequential)]
public struct GpuScenarioRate
{
    public double PriorRate;  // Used for events before the calculation date
    public double AfterRate;  // Used for events on or after the calculation date
}
```

### Event Types

```csharp
public static class GpuEventType
{
    public const int IED  = 0;   // Initial Exchange — principal is exchanged
    public const int IP   = 1;   // Interest Payment
    public const int IPCI = 2;   // Interest Payment Capitalisation
    public const int PRD  = 3;   // Purchase
    public const int TD   = 4;   // Termination
    public const int RR   = 5;   // Rate Reset (variable)
    public const int RRF  = 6;   // Rate Reset (fixed / pre-agreed)
    public const int FP   = 7;   // Fee Payment
    public const int SC   = 8;   // Scaling
    public const int MD   = 9;   // Maturity — principal returned
    public const int AD   = 10;  // Analysis Date
    public const int CD   = 11;  // Credit Default
}
```

Source: `src/ActusInsurance.GPU/Models/GpuEventType.cs`

### Day Count Conventions

| Code | Constant | Description |
|---|---|---|
| 0 | `A365` | Actual / 365 |
| 1 | `A360` | Actual / 360 |
| 2 | `E30_360` | 30E / 360 |
| 3 | `AA` | Actual / Actual ISDA |
| 4 | `B252` | Business days / 252 (defined but not computed in kernel) |
| 5 | `A336` | Actual / 336 |

Source: `src/ActusInsurance.GPU/Models/GpuDayCountCode.cs`

### Contract Kinds

`GpuContractKind` lists all ACTUS contract types known to the library. Currently only `PAM = 0` is implemented in the GPU kernel.

Source: `src/ActusInsurance.GPU/Models/GpuContractKind.cs`

### Scenario Model

```
ScenarioSet
├── CalculationDate (DateTime)
└── Scenarios[]
    └── Scenario
        ├── ScenarioId (int)
        └── Variables (Dictionary<string, ScenarioRateSeries>)
            └── ScenarioRateSeries
                └── data: SortedList<long ticks, (double prior, double after)>
```

Lookup falls back to the closest earlier time entry if an exact match is not found.

Source: `src/ActusInsurance.GPU/Models/ScenarioSet.cs`

### Scenario Outcome

```csharp
public struct ScenarioOutcome
{
    public double TotalPayoff;
    public double FinalNotionalPrincipal;
    public double FinalAccruedInterest;
    public double FinalNominalRate;
}
// Layout: outcomes[contractIndex * numScenarios + scenarioIndex]
```

Source: `src/ActusInsurance.GPU/Models/ScenarioOutcome.cs`

### Evidence from Code

- `src/ActusInsurance.GPU/Models/PamContractGpu.cs`
- `src/ActusInsurance.GPU/Models/PamEventGpu.cs`
- `src/ActusInsurance.GPU/Models/PamEventResultGpu.cs`
- `src/ActusInsurance.GPU/Models/GpuMarketRate.cs`
- `src/ActusInsurance.GPU/Models/GpuScenarioRate.cs`
- `src/ActusInsurance.GPU/Models/GpuEventType.cs`
- `src/ActusInsurance.GPU/Models/GpuDayCountCode.cs`
- `src/ActusInsurance.GPU/Models/GpuContractKind.cs`
- `src/ActusInsurance.GPU/Models/ScenarioSet.cs`
- `src/ActusInsurance.GPU/Models/ScenarioOutcome.cs`
