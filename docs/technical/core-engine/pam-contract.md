---
title: PAM Contract Implementation
description: Complete walkthrough of the Principal at Maturity contract type — contract terms, schedule generation, event evaluation, payoff formulas, and state initialization.
category: Technical
order: 2
---

# PAM Contract Implementation

## Overview

PAM (Principal at Maturity) is the most fundamental ACTUS contract type. It models any financial instrument where a principal amount is exchanged at the start, periodic interest payments occur during the life of the contract, and the full principal is returned at maturity. Common examples include bullet loans, fixed-term deposits, zero-coupon bonds, and simple floating-rate notes.

The PAM implementation is the only contract type fully realized in this codebase. It is also the most complex: the 42 official ACTUS reference test cases exercise every feature — fixed and floating rates, fee schedules, capitalization periods, scaling indices, purchase and termination events, and all convention combinations. Passing all 42 tests means the implementation is complete and correct according to the ACTUS standard.

The implementation lives in a single static class, `PrincipalAtMaturity` (346 lines), in the `ActusInsurance.Core.CPU` project. It has two public methods: `Schedule()` generates the raw events, and `Apply()` evaluates them. All supporting abstractions — contract terms, events, state, conventions — live in `ActusInsurance.Core`.

## Contract Terms: The Input

Before understanding what the engine does, you need to understand what it works with. A PAM contract is fully defined by the `PamContractTerms` class — a sealed data object with over 40 properties. These properties fall into seven categories, described here from most fundamental to most specialized.

### Identity and Dates

Every contract has a unique identifier, a role (asset or liability), and a set of critical dates that define its lifecycle:

| Field | Type | Description |
|---|---|---|
| ContractID | string | Unique identifier for the contract |
| ContractType | string | Always returns "PAM" (hard-coded) |
| ContractRole | ContractRole | RPA (asset) or RPL (liability) — determines the sign of cash flows |
| StatusDate | DateTime | The observation date — the "as of" date for the current state |
| InitialExchangeDate | DateTime | When principal is first exchanged (contract activation) |
| MaturityDate | DateTime | When principal is returned (contract ends) |
| PurchaseDate | DateTime? | Optional: date of secondary market purchase |
| TerminationDate | DateTime? | Optional: date of early termination |
| CapitalizationEndDate | DateTime? | Optional: date when interest capitalization stops |

The `StatusDate` is critical: it determines the initial state. If the StatusDate is before the InitialExchangeDate, the contract has not yet started and the initial principal is zero. If it is after, the contract is active and the state reflects its current position.

### Principal and Interest

The core financial parameters:

| Field | Type | Default | Description |
|---|---|---|---|
| NotionalPrincipal | double | 0 | Face value of the contract |
| NominalInterestRate | double | 0 | Annual interest rate (e.g., 0.05 = 5%) |
| AccruedInterest | double | 0 | Interest accumulated since the last payment date |
| PremiumDiscountAtIED | double | 0 | Premium or discount applied at initial exchange |
| PriceAtPurchaseDate | double | 0 | Price paid for secondary market purchase |
| PriceAtTerminationDate | double | 0 | Price received at early termination |

### Payment Cycles

Periodic events (interest payments, rate resets, fees, scaling updates) are defined by cycle strings — ISO 8601-style period expressions that specify frequency and stub handling. Each cycle has an optional anchor date that determines when the cycle starts; if omitted, it defaults to the InitialExchangeDate.

| Field | Type | Description |
|---|---|---|
| CycleOfInterestPayment | string? | Payment frequency (e.g., "P3ML0" = quarterly, long stub) |
| CycleAnchorDateOfInterestPayment | DateTime? | Start date of the payment cycle |
| CycleOfRateReset | string? | Rate reset frequency (floating-rate contracts only) |
| CycleOfFee | string? | Fee payment frequency |
| CycleOfScalingIndex | string? | Scaling index update frequency |

The cycle string format is explained in detail in [Schedule Generation](./scheduling.md). In brief: "P3ML0" means a period of 3 months with a long stub, and "P1YL0" means annual with a long stub.

### Rate Reset Parameters

For floating-rate contracts, the interest rate is periodically updated from market data. The rate reset mechanism has six parameters that control how the new rate is derived and constrained:

| Field | Type | Default | Description |
|---|---|---|---|
| MarketObjectCodeOfRateReset | string? | null | Key to look up the market rate in the RiskFactorModel |
| RateMultiplier | double | 1.0 | Multiplied by the market rate before adding the spread |
| RateSpread | double | 0 | Added to the scaled market rate |
| NextResetRate | double? | null | If set, used for the first RRF event instead of a market lookup |
| LifeCap | double | +∞ | Maximum rate allowed over the contract's lifetime |
| LifeFloor | double | −∞ | Minimum rate allowed over the contract's lifetime |
| PeriodCap | double | +∞ | Maximum rate change allowed in a single reset period |
| PeriodFloor | double | −∞ | Minimum rate change allowed in a single reset period |

The rate reset algorithm (described in [State Machine](./state-machine.md)) applies these constraints in two stages: first clamping the delta (change) to the period bounds, then clamping the resulting absolute rate to the lifetime bounds.

### Fee Parameters

| Field | Type | Description |
|---|---|---|
| FeeBasis | string? | "A" for absolute (fixed amount per period) or "N" for notional (percentage of principal) |
| FeeRate | double | The fee amount (absolute) or fee rate (notional) |
| FeeAccrued | double | Fees accumulated since the last fee payment |

### Scaling Parameters

Scaling adjusts future cash flows based on an external index (e.g., an inflation index). The scaling effect can apply to the notional, to the interest, or to both:

| Field | Type | Default | Description |
|---|---|---|---|
| MarketObjectCodeOfScalingIndex | string? | null | Key to look up the index value in the RiskFactorModel |
| ScalingIndexAtContractDealDate | double | 0 | Base index value at contract inception |
| NotionalScalingMultiplier | double | 1.0 | Current multiplier for notional-dependent cash flows |
| InterestScalingMultiplier | double | 1.0 | Current multiplier for interest-dependent cash flows |
| ScalingEffect | string? | null | "N" (notional only), "I" (interest only), or "NI" (both) |

### Convention Selections

Each contract specifies which financial conventions to use for date arithmetic:

| Field | Type | Default | Description |
|---|---|---|---|
| DayCountConvention | enum | A_365 | How year fractions are calculated (see [Conventions](./conventions/index.md)) |
| BusinessDayConvention | enum | NOS | How non-business days are handled |
| EndOfMonthConvention | bool | false | Whether to snap schedule dates to month-ends |
| Calendar | enum | NC | Which calendar defines business days |

### The RoleSign

A key derived property: `RoleSign` returns +1 for asset positions (RPA, BUY, RFL, RF) and −1 for liability positions (RPL, SEL, PFL, PF). This single sign determines the direction of all cash flows. It is computed once and cached for performance.

### Deserialization

The `FromDictionary()` static factory method creates a `PamContractTerms` from a generic `IDictionary<string, object>`, matching the JSON structure used in the official ACTUS test suite. It handles type conversions (string to double, string to DateTime, string to enum), sets defaults for optional dates, and uses invariant culture parsing throughout.

## Schedule Generation

The `Schedule()` method is the first stage of the pipeline. It takes a horizon date (how far into the future to generate events) and the contract terms, and produces a list of raw, unevaluated events.

### The Algorithm

Schedule generation follows a fixed eight-step process:

**Step 1 — Mandatory events.** Every PAM contract has at least two events: an Initial Exchange Date (IED) and a Maturity Date (MD). These are always created.

```
events.Add(IED at InitialExchangeDate)
events.Add(MD at MaturityDate)
```

**Step 2 — Purchase event.** If `PurchaseDate` is set, add a PRD event.

**Step 3 — Interest payment schedule.** If `CycleOfInterestPayment` is set (or an anchor date is provided), generate periodic dates from the anchor (or IED) to maturity using the `ScheduleFactory`. These become either IP events (interest payment) or IPCI events (interest capitalization), depending on whether the date falls before or after the `CapitalizationEndDate`:

- Dates on or before `CapitalizationEndDate` → IPCI events
- Dates after `CapitalizationEndDate` → IP events
- If `CapitalizationEndDate` is not in the generated schedule, it is added as an additional IPCI event

If there is no payment cycle but a `CapitalizationEndDate` exists, a single IPCI event is created at that date.

**Step 4 — Rate reset schedule.** If `CycleOfRateReset` is set, generate periodic dates and create RR events. One exception: the first reset event after the StatusDate where `NextResetRate` is available becomes an RRF event (fixed rate reset) instead.

**Step 5 — Fee payment schedule.** If `CycleOfFee` is set, generate periodic dates and create FP events.

**Step 6 — Scaling schedule.** If `ScalingEffect` contains "N" or "I" and a cycle is defined, generate periodic dates and create SC events.

**Step 7 — Termination handling.** If `TerminationDate` is set:
- Add an IP event at the termination date (final interest payment)
- Add a TD event at the termination date
- Remove all events that fall after the termination date

**Step 8 — Filter and sort.** Remove events before the StatusDate, remove events beyond the horizon date, and sort the remaining events by time (ascending) and event-type priority (for same-time events).

### Business Day Adjustment

Each event carries two times:
- **ScheduleTime** — the original, unadjusted date from the cycle
- **Time** — the date shifted by the business day convention (e.g., moved to the next business day if the original falls on a weekend)

The shifted time is used for ordering and settlement. The schedule time is used for interest accrual calculations in CalcShift conventions, where the calculation should use the original contractual date regardless of when the payment actually settles.

## Event Application

The `Apply()` method is the second stage. It takes the raw events from `Schedule()`, the contract terms, and a risk factor model (market data), and produces evaluated events with computed payoffs and state snapshots.

### State Initialization

Before processing any events, the contract state must be initialized from the terms. This is not trivial — it depends on the relationship between the StatusDate and the InitialExchangeDate.

**If the contract has not yet started** (StatusDate < IED):
- NotionalPrincipal = 0
- NominalInterestRate = 0
- AccruedInterest = 0

**If the contract is already active** (StatusDate ≥ IED):
- NotionalPrincipal = RoleSign × NotionalPrincipal from terms
- NominalInterestRate = NominalInterestRate from terms

**Accrued interest initialization** follows a three-level fallback:
1. If the nominal rate is zero → accrued interest = 0
2. If the terms provide a non-zero AccruedInterest → use that value directly
3. Otherwise, compute it: find the last interest payment cycle date before StatusDate, compute the year fraction from that date to StatusDate, and multiply by rate × notional

**Scaling multipliers** are initialized from the terms (default 1.0).

**Fee accrued** follows the same fallback: use the provided value if non-zero, otherwise default to 0.

### The Processing Loop

After initialization, the events are sorted and processed in sequence:

```
for each event in sorted order:
    event.Evaluate(ref stateSpace, terms, riskFactors, businessDayAdjuster)
```

The `Evaluate()` method on each event performs three operations:

1. **ComputePayoff** — calculates the cash flow for this event type
2. **UpdateState** — modifies the state space according to this event type
3. **Snapshot** — copies the current state variables into the event for reporting

### Post-Processing

After all events are evaluated, if the contract has a PurchaseDate, events before the purchase date are removed (except AD events), and the IP event on the purchase date itself is removed. This reflects the fact that the buyer does not receive interest payments that occurred before their purchase.

## Payoff Formulas

Each event type computes its payoff differently. The formulas below use the following notation:
- `fxRate` — foreign exchange rate (currently always 1.0)
- `R` — RoleSign (+1 or −1)
- `N` — NotionalPrincipal (state, already signed by role)
- `r` — NominalInterestRate (state)
- `A` — AccruedInterest (state)
- `Δt` — year fraction from previous event to current event
- `S_n` — NotionalScalingMultiplier (state)
- `S_i` — InterestScalingMultiplier (state)

### IED (Initial Exchange Date)

```
Payoff = fxRate × R × (−1) × (NotionalPrincipal_terms + PremiumDiscountAtIED)
```

The negative sign reflects that the lender pays out the principal. The RoleSign ensures the correct direction for asset vs. liability positions.

### MD (Maturity Date)

```
Payoff = fxRate × S_n × N
```

The principal is returned, scaled by the notional scaling multiplier if scaling is active.

### IP (Interest Payment)

```
Payoff = fxRate × S_i × (A + Δt × r × N)
```

This is the most frequently computed payoff. It includes both the interest that has been accruing since the last event (`A`) and the interest for the final sub-period from the last accrual to this payment date (`Δt × r × N`). The interest scaling multiplier adjusts for index-linked contracts.

### IPCI (Interest Capitalization)

```
Payoff = 0
```

No cash flow occurs. Instead, the accrued interest is added to the principal (handled in the state update).

### FP (Fee Payment)

For absolute fees (FeeBasis = "A"):
```
Payoff = fxRate × R × FeeRate
```

For notional fees (FeeBasis = "N"):
```
Payoff = fxRate × (FeeAccrued + N × FeeRate × Δt)
```

### PRD (Purchase Date)

```
Payoff = fxRate × R × (−1) × PriceAtPurchaseDate
```

### TD (Termination Date)

```
Payoff = fxRate × R × PriceAtTerminationDate
```

### RR, RRF, SC (Rate Reset, Fixed Rate Reset, Scaling)

```
Payoff = 0
```

These are administrative events — they modify the state but produce no cash flow.

## Interest Accrual

Between any two consecutive events, interest accrues continuously. The engine computes this accrual before processing certain event types (IP, IPCI, RR, FP, SC). The accrual formula:

```
AccruedInterest += NominalInterestRate × NotionalPrincipal × YearFraction(prevDate, currentDate)
```

The year fraction depends on the day count convention and is computed using the `DayCountCalculator`. The dates used for the calculation depend on the business day convention: CalcShift conventions use the original schedule dates, while ShiftCalc conventions use the shifted dates.

Fee accrual (for notional-basis fees) follows the same pattern:

```
FeeAccrued += FeeRate × NotionalPrincipal × YearFraction(prevDate, currentDate)
```

Both accruals only occur when the contract has a non-zero notional and the event is strictly after the previous status date.

## Scaling

When a scaling event (SC) is processed, the engine looks up the current index value from the risk factor model and computes a scaling factor relative to the base index:

```
scalingFactor = currentIndex / ScalingIndexAtContractDealDate
```

Depending on the `ScalingEffect` setting:
- If it contains "N": `NotionalScalingMultiplier = scalingFactor × model.NotionalScalingMultiplier`
- If it contains "I": `InterestScalingMultiplier = scalingFactor × model.InterestScalingMultiplier`
- If it contains "NI": both are updated

This mechanism allows contracts to be linked to inflation indices or other market benchmarks, with the scaling multipliers flowing into the payoff formulas for MD (notional scaling) and IP (interest scaling).

## Continue Reading

- [State Machine](./state-machine.md) — detailed state transitions for each event type, including the rate reset algorithm with caps and floors
- [Schedule Generation](./scheduling.md) — how cycle strings are parsed and periodic date sequences are built
- [Conventions](./conventions/index.md) — day count, business day, and calendar convention implementations
- [Risk Factor Model](./risk-factors.md) — how market data is stored and retrieved
- [Technical Reference](./reference.md) — complete listing of all types, enumerations, and interfaces
