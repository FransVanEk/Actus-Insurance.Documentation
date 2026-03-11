---
title: Technical Reference
description: Complete listing of all types, enumerations, interfaces, structs, and classes in the ACTUS core engine — organized by namespace and category.
category: Technical
order: 7
---

# Technical Reference

This page provides a comprehensive listing of every type in the ACTUS core engine. It is organized by category (enumerations, interfaces, classes, structs) and serves as a quick reference for understanding the codebase. Each entry includes the type's purpose, its members, and where it is used.

## Enumerations

### EventType

Defines the type of each contract event. Used in `ContractEvent.Type` and in the payoff/state-update dispatch logic.

| Value | Name | Priority | Description |
|---|---|---|---|
| AD | Analysis Date | — | Placeholder for analysis (not actively used in PAM) |
| IED | Initial Exchange Date | 0 | Contract activation — principal is exchanged |
| MD | Maturity Date | 9 | Contract ends — principal is returned |
| IP | Interest Payment | 1 | Periodic interest payment |
| IPCI | Interest Capitalization | 2 | Interest added to principal instead of paid out |
| PRD | Purchase Date | 3 | Secondary market purchase |
| TD | Termination Date | 4 | Early contract termination |
| RR | Rate Reset | 5 | Interest rate updated from market data |
| RRF | Rate Reset Fixed | 6 | Interest rate updated to pre-agreed fixed value |
| FP | Fee Payment | 7 | Periodic fee payment |
| SC | Scaling | 8 | Scaling multipliers updated from index |
| CD | Credit Default | 10 | Credit default event (not implemented in PAM) |

Priority determines processing order when multiple events fall on the same date. Lower priority numbers are processed first.

### ContractRole

Determines the direction of cash flows. Used in `PamContractTerms.ContractRole` and the `RoleSign` computation.

| Value | Name | RoleSign | Description |
|---|---|---|---|
| RPA | Real Position Asset | +1 | Receives principal (lender, depositor) |
| RPL | Real Position Liability | −1 | Pays principal (borrower) |
| BUY | Buy | +1 | Buyer position |
| SEL | Sell | −1 | Seller position |
| RFL | Receive First Leg | +1 | Swap: receives the first leg |
| PFL | Pay First Leg | −1 | Swap: pays the first leg |
| RF | Receive Fixed | +1 | Swap: receives fixed rate |
| PF | Pay Fixed | −1 | Swap: pays fixed rate |

### DayCountConvention

Defines how year fractions are calculated for interest accrual. Used in `PamContractTerms.DayCountConvention`.

| Value | String Key | Year Basis | Description |
|---|---|---|---|
| A_AISDA | "AA" | 365/366 | Actual/Actual ISDA — leap-year-aware |
| A_360 | "A360" | 360 | Actual/360 — actual days ÷ 360 |
| A_365 | "A365" | 365 | Actual/365 Fixed — actual days ÷ 365 |
| E30_360ISDA | "30E360ISDA" | 360 | 30E/360 ISDA — with maturity date exception |
| E30_360 | "30E360" | 360 | 30E/360 — day 31 becomes day 30 |
| B_252 | "B252" | 252 | Business/252 — business days ÷ 252 |
| A_336 | "A336" | 336 | Actual/336 — actual days ÷ 336 |

### BusinessDayConventionEnum

Defines how non-business days are handled. Used in `PamContractTerms.BusinessDayConvention`.

| Value | Shift Strategy | Calc Strategy | Description |
|---|---|---|---|
| NOS | Same | ShiftCalc | No adjustment |
| CSF | Following | CalcShift | Settle forward, calc on original |
| CSMF | Modified Following | CalcShift | Settle modified forward, calc on original |
| CSP | Preceding | CalcShift | Settle backward, calc on original |
| CSMP | Modified Preceding | CalcShift | Settle modified backward, calc on original |
| SCF | Following | ShiftCalc | Settle and calc on shifted forward date |
| SCMF | Modified Following | ShiftCalc | Settle and calc on modified forward date |
| SCP | Preceding | ShiftCalc | Settle and calc on shifted backward date |
| SCMP | Modified Preceding | ShiftCalc | Settle and calc on modified backward date |
| NO_ADJUST | Same | ShiftCalc | Legacy alias for NOS |

### Calendar

Defines which days are business days. Used in `PamContractTerms.Calendar`.

| Value | Description |
|---|---|
| NC | No Calendar — all days are business days |
| MF | Monday to Friday — weekdays only |
| MFH | Monday to Friday with Holidays — weekdays minus holiday set |

### EndOfMonthConventionEnum

Defines how schedule dates align to month-ends. Used internally by the `EndOfMonthAdjuster`.

| Value | Description |
|---|---|
| SD | Same Day — no adjustment |
| EOM | End of Month — snap to last day of month (if conditions are met) |

### ContractTypeEnum

All ACTUS contract types. Only PAM is implemented in this codebase.

| Value | Name | Status |
|---|---|---|
| PAM | Principal at Maturity | **Implemented** |
| ANN | Annuity | Not implemented |
| NAM | Negative Amortization | Not implemented |
| LAM | Linear Amortization | Not implemented |
| LAX | Linear Amortization with Extension | Not implemented |
| CLM | Call Money | Not implemented |
| UMP | Undefined Maturity Profile | Not implemented |
| CSH | Cash | Not implemented |
| STK | Stock | Not implemented |
| COM | Commodity | Not implemented |
| SWAPS | Plain Vanilla Interest Rate Swap | Not implemented |
| SWPPV | Plain Vanilla IR Swap PV | Not implemented |
| FXOUT | Foreign Exchange Outright | Not implemented |
| CAPFL | Caplet/Floorlet | Not implemented |
| FUTUR | Future | Not implemented |
| OPTNS | Option | Not implemented |
| CEG | Credit Enhancement Guarantee | Not implemented |
| CEC | Credit Enhancement Collateral | Not implemented |
| BCS | Basic Credit Support | Not implemented |

### ContractPerformance

Tracks the performance status of a contract over its lifetime.

| Value | Name | Description |
|---|---|---|
| PF | Performing | Contract is operating normally |
| DL | Delayed | Payments are delayed |
| DQ | Delinquent | Payments are significantly overdue |
| DF | Default | Contract is in default |
| MA | Matured | Contract has reached maturity |
| TE | Terminated | Contract was terminated early |

### FeeBasis

Determines how fees are calculated.

| Value | Name | Description |
|---|---|---|
| A | Absolute | Fixed amount per period (e.g., $100 per quarter) |
| N | Notional | Percentage of principal (e.g., 0.1% of notional per quarter) |

### CyclePointOfInterestPayment / CyclePointOfRateReset

Determines whether the event is at the beginning or end of its cycle period.

| Value | Description |
|---|---|
| B | Beginning of period |
| E | End of period |

## Interfaces

### IContractTerms

Base interface for all contract term types.

| Member | Type | Description |
|---|---|---|
| ContractID | string | Unique contract identifier |
| ContractType | string | ACTUS contract type code |
| Currency | string | ISO currency code |
| StatusDate | DateTime | Observation/analysis date |
| MaturityDate | DateTime | Contract end date |

Implemented by: `PamContractTerms`

### IContractScheduler\<TTerms\>

Generic interface for contract processors.

| Method | Returns | Description |
|---|---|---|
| Schedule(DateTime to, TTerms terms) | List\<ContractEvent\> | Generate raw events |
| Apply(List\<ContractEvent\>, TTerms, RiskFactorModel) | List\<ContractEvent\> | Evaluate events with state |

Implemented by: `PrincipalAtMaturity` (with TTerms = PamContractTerms)

### IDayCountConventionProvider

Interface for day count convention implementations.

| Method | Returns | Description |
|---|---|---|
| DayCount(DateTime start, DateTime end) | double | Raw day count between dates |
| DayCountFraction(DateTime start, DateTime end) | double | Year fraction between dates |

Implemented by: `ActualThreeSixtyFiveFixed`, `ActualThreeSixty`, `ActualActualISDA`, `ThirtyEThreeSixty`, `ThirtyEThreeSixtyISDA`, `BusinessTwoFiftyTwo`, `ActualThreeThirtySix`, `TwentyEightThreeThirtySix`

### IBusinessDayConvention

Interface for business day shift strategies.

| Method | Returns | Description |
|---|---|---|
| Shift(DateTime date) | DateTime | Shift date to nearest business day |

Implemented by: `Same`, `Following`, `ModifiedFollowing`, `Preceeding`, `ModifiedPreceeding`

### IShiftCalcConvention

Interface for calc/shift strategies.

| Method | Returns | Description |
|---|---|---|
| Shift(DateTime time, IBusinessDayConvention bd) | DateTime | Apply calc convention |

Implemented by: `ShiftCalc` (applies business day shift), `CalcShift` (returns original date)

### IEndOfMonthConvention

Interface for end-of-month adjustments.

| Method | Returns | Description |
|---|---|---|
| Shift(DateTime date) | DateTime | Apply EOM adjustment |

Implemented by: `EndOfMonth`, `SameDay`

### ICycleAdjusterProvider

Interface for cycle arithmetic (advancing/retreating by one cycle).

| Method | Returns | Description |
|---|---|---|
| PlusCycle(DateTime time) | DateTime | Advance by one cycle |
| MinusCycle(DateTime time) | DateTime | Retreat by one cycle |

Implemented by: `PeriodCycleAdjuster`, `WeekdayCycleAdjuster`

## Classes

### PamContractTerms (sealed)

The complete domain model for a PAM contract. Over 40 properties organized into: identity and dates, principal and interest, payment cycles, rate reset parameters, fee parameters, scaling parameters, and convention selections. Includes `FromDictionary()` factory for JSON deserialization and `RoleSign` cached property.

**File:** `ActusInsurance.Core/Models/PamContractTerms.cs` (~306 lines)

### ContractEvent (sealed)

Represents a single event in a contract's life. Properties: Time, ScheduleTime, Type, Currency, Payoff, and state snapshot fields. Methods: `Evaluate()` (orchestrates payoff + state update + snapshot), `ComputePayoff()`, `UpdateState()`, and helper methods for each event type. Implements `IComparable<ContractEvent>` for deterministic sorting.

**File:** `ActusInsurance.Core/Events/ContractEvent.cs`

### PrincipalAtMaturity (static)

The PAM contract processor. Two static methods: `Schedule()` generates events from terms, `Apply()` evaluates events with market data. Contains `InitializeStateSpace()` for state initialization and `CreateBusinessDayAdjuster()` factory.

**File:** `ActusInsurance.Core.CPU/Contracts/PAM.cs` (~346 lines)

### RiskFactorModel (sealed)

Market data storage and lookup. Stores constant rates and time series. `GetRate()` uses a four-step priority: constant → exact match → LOCF → default (0.0).

**File:** `ActusInsurance.Core/Externals/RiskFactorModel.cs`

### DayCountCalculator

Factory class that takes a convention string and produces the corresponding `IDayCountConventionProvider` implementation. Maps: "AA" → ActualActualISDA, "A360" → ActualThreeSixty, "A365" → ActualThreeSixtyFiveFixed, "30E360" → ThirtyEThreeSixty, "30E360ISDA" → ThirtyEThreeSixtyISDA, "B252" → BusinessTwoFiftyTwo, "A336" → ActualThreeThirtySix, "28336" → TwentyEightThreeThirtySix.

**File:** `ActusInsurance.Core/Conventions/DayCount/DayCountCalculator.cs`

### BusinessDayAdjuster (sealed)

Coordinates business day and calc/shift conventions. Two methods: `ShiftEventTime()` for settlement date, `ShiftCalcTime()` for calculation date. Internally delegates to `IBusinessDayConvention` and `IShiftCalcConvention` instances.

**File:** `ActusInsurance.Core/Conventions/BusinessDay/BusinessDayAdjuster.cs`

### EndOfMonthAdjuster (sealed)

Coordinates end-of-month adjustment. Evaluates two conditions (last-day-of-month anchor + month-based cycle) before activating EOM shift. Falls back to SameDay if conditions are not met.

**File:** `ActusInsurance.Core/Conventions/EndOfMonth/EndOfMonthAdjuster.cs`

### ScheduleFactory (static)

Generates periodic date sequences. `CreateSchedule()` takes start, end, cycle string, EOM flag, and include-end flag. Handles null cycles, forward generation, EOM adjustment, and long/short stub logic.

**File:** `ActusInsurance.Core/Time/ScheduleFactory.cs`

### CycleAdjuster

Dispatches between period-based and weekday-based cycle arithmetic. Wraps either a `PeriodCycleAdjuster` or a `WeekdayCycleAdjuster`.

**File:** `ActusInsurance.Core/Time/CycleAdjuster.cs`

### Calendar Providers

| Class | Calendar | Business Days |
|---|---|---|
| BusinessDayCalendarProvider | MF (base) | Monday–Friday |
| MondayToFridayCalendar | MF | Monday–Friday |
| MondayToFridayWithHolidaysCalendar | MFH | Monday–Friday minus holidays (HashSet) |
| NoHolidaysCalendar | NC | All days |

**Directory:** `ActusInsurance.Core/Time/Calendar/`

## Structs

### StateSpace

Value struct carrying the complete contract state between events: NotionalPrincipal, NominalInterestRate, AccruedInterest, FeeAccrued, NotionalScalingMultiplier, InterestScalingMultiplier, StatusDate, ContractPerformance.

**File:** `ActusInsurance.Core/States/StateSpace.cs` (~30 lines)

### Period

Data class for parsed cycle periods: Years (int), Months (int), Days (int). `GetMonths()` returns `Months + (Years × 12)`.

**File:** defined within `CycleUtils.cs`

## Utility Classes

### CycleUtils (static)

Cycle string parsing. Methods: `IsPeriod()`, `ParsePeriod()`, `ParseStub()`, `ParseWeekday()`, `ParsePosition()`.

### StringUtils (static)

Convention string constants: LongStub ('0'), ShortStub ('1'), day count convention keys ("AA", "A360", "A365", etc.), calc/shift convention markers ("CS", "SC").

### CommonUtils (static)

Null-check helper: `IsNull()` returns true for null objects or empty strings.

### Constants (static)

Maximum contract lifetimes: MAX_LIFETIME (50 years), MAX_LIFETIME_STK (10 years), MAX_LIFETIME_UMP (10 years).

### TimeAdjuster (static)

Hour rounding: `ToFullHours()` rounds a DateTime to the nearest full hour.

### AttributeConversionException

Standard exception class for parsing/conversion errors during term deserialization.

## Project Dependencies

### ActusInsurance.Core

- Target: .NET 9.0
- External dependencies: **none** (pure C#)
- Role: shared abstractions, models, conventions, utilities

### ActusInsurance.Core.CPU

- Target: .NET 9.0
- Dependencies: ActusInsurance.Core (project reference)
- Role: PAM contract processor

### ActusInsurance.Tests.CPU

- Target: .NET 9.0
- Dependencies:
  - ActusInsurance.Core (project reference)
  - ActusInsurance.Core.CPU (project reference)
  - NUnit 4.2.2
  - Microsoft.NET.Test.Sdk 17.12.0
  - NUnit.Analyzers 4.4.0
  - NUnit3TestAdapter 4.6.0
  - coverlet.collector 6.0.2
- Test data: `Resources/actus-tests-pam.json` (42 test cases)
- Tolerance: 2×10⁻¹⁰ for double comparisons (10 decimal places after rounding)
