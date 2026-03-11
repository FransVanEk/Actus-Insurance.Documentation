---
title: Schedule Generation
description: How periodic date sequences are built from cycle strings — cycle parsing, the ScheduleFactory algorithm, stub handling, end-of-month adjustment, and weekday-based cycles.
category: Technical
order: 5
---

# Schedule Generation

## Overview

Schedule generation is the process of turning a contract's cycle definitions (e.g., "pay interest every 3 months") into a concrete list of dates. These dates become events in the contract's timeline. The schedule generator is used by the PAM contract processor for all periodic event types: interest payments (IP/IPCI), rate resets (RR/RRF), fee payments (FP), and scaling updates (SC).

The schedule generation pipeline has three components:

1. **Cycle parsing** — converting a cycle string like "P3ML0" into its constituent parts (period, stub type)
2. **Date sequence generation** — the `ScheduleFactory` that produces periodic dates from a start date to an end date
3. **Date adjustment** — applying end-of-month and business day conventions to the generated dates

## Cycle Strings

A cycle string defines how often an event recurs and how to handle partial periods at the boundaries. The format follows an extended ISO 8601 convention:

```
P[value][unit]L[stub]
```

Where:
- `P` — marks this as a period definition
- `[value]` — the number of units per cycle (e.g., 3)
- `[unit]` — the time unit: `Y` (years), `M` (months), `D` (days)
- `L` — separator before the stub indicator
- `[stub]` — how to handle partial periods: `0` (long stub) or `1` (short stub)

### Common Cycle Strings

| Cycle String | Meaning |
|---|---|
| P1ML0 | Every 1 month, long stub |
| P3ML0 | Every 3 months (quarterly), long stub |
| P6ML0 | Every 6 months (semi-annual), long stub |
| P1YL0 | Every 1 year (annual), long stub |
| P1DL0 | Every 1 day (daily), long stub |
| P3ML1 | Every 3 months, short stub |

### What is a Stub?

A stub is a partial period that occurs when the schedule's start date and end date don't align perfectly with the cycle length. For example, a quarterly cycle starting on January 15 and ending on November 30 has a partial period at the end (October 15 to November 30 — only 46 days instead of a full quarter).

**Long stub (L0):** The partial period is merged into the adjacent regular period, creating one longer-than-normal period. In the example above, the last period would run from July 15 to November 30 — longer than a normal quarter. The schedule removes the second-to-last generated date to create this merged period.

**Short stub (L1):** The partial period stands on its own as a short period. The last period runs from October 15 to November 30, and the prior period runs from July 15 to October 15 (a full quarter).

### Cycle Parsing

The `CycleUtils` class parses cycle strings into their components:

- `IsPeriod(cycle)` — checks if the string starts with "P" (period-based cycle vs. weekday-based)
- `ParsePeriod(cycle)` — returns a `Period` with Years, Months, and Days fields
- `ParseStub(cycle)` — returns the stub character: '0' (long) or '1' (short)

The `Period` class has a `GetMonths()` method that converts years to months: `Months + (Years × 12)`. This is used by the end-of-month adjuster to determine whether EOM logic applies (only for month-based periods).

## The ScheduleFactory

The `ScheduleFactory.CreateSchedule()` method is the core schedule generator. It takes five parameters:

| Parameter | Type | Description |
|---|---|---|
| startTime | DateTime | Cycle anchor — the first date in the sequence |
| endTime | DateTime | Cycle end — the date the sequence runs to |
| cycle | string | The cycle string (e.g., "P3ML0") |
| endOfMonthConvention | bool | Whether to apply EOM adjustment |
| includeEndDate | bool | Whether to include the end date in the output |

### The Algorithm

**Step 1 — Handle null cycles.** If no cycle is provided, return just the start date (and optionally the end date). This handles single-event schedules.

**Step 2 — Parse the cycle.** Extract the stub type, the period (Years/Months/Days), and create an `EndOfMonthAdjuster` based on the convention flag, the start date, and the cycle. The EOM adjuster only activates if the start date is the last day of its month and the cycle is month-based.

**Step 3 — Generate dates forward.** Starting from `startTime`, repeatedly add the period to produce dates:

```
counter = 1
currentDate = startTime
while currentDate < endTime:
    add currentDate to schedule
    if period.Years > 0:
        nextDate = startTime + (Years × counter)
    else if period.Months > 0:
        nextDate = startTime + (Months × counter)
    else:
        nextDate = startTime + (Days × counter)
    currentDate = EndOfMonthAdjuster.Shift(nextDate)
    counter++
```

Note that each date is computed from the original start date (not from the previous date). This avoids cumulative rounding errors that would occur with repeated addition.

**Step 4 — Add the end date** if `includeEndDate` is true.

**Step 5 — Handle long stubs.** If the stub type is "long" and the generated schedule has more than two dates, and the last generated date does not exactly equal the end date, remove the second-to-last date. This merges the final short period into the previous one, creating a single long period.

**Step 6 — Return** the set of dates. The schedule is stored as a `HashSet<DateTime>` to prevent duplicates (which can occur when a generated date coincidentally equals the end date).

### Example: Quarterly Schedule

Contract starts January 1, 2025. Maturity March 15, 2026. Cycle: "P3ML0" (quarterly, long stub).

Generated sequence:
1. Jan 1, 2025
2. Apr 1, 2025
3. Jul 1, 2025
4. Oct 1, 2025
5. Jan 1, 2026

End date (Mar 15, 2026) is added. The last generated date (Jan 1, 2026) does not equal the end date, and stub is long, so Jan 1, 2026 is removed. Final schedule:

- Jan 1, 2025
- Apr 1, 2025
- Jul 1, 2025
- Oct 1, 2025
- Mar 15, 2026 ← long stub period (5.5 months instead of 3)

## End-of-Month Adjustment

When schedule dates are generated, the `EndOfMonthAdjuster` may shift each generated date to the last day of its month. This only happens when two conditions are met:

1. The cycle anchor date is the last day of its month (e.g., January 31, February 28)
2. The cycle is month-based (the period's `GetMonths()` returns a value greater than 0)

If both conditions are met and the EOM convention is enabled, the `EndOfMonth` shift snaps each date to the last day of its month:

```
Shift(date) → DateTime(date.Year, date.Month, DaysInMonth(date.Year, date.Month))
```

This means a monthly cycle starting on January 31 produces: Jan 31, Feb 28 (or 29), Mar 31, Apr 30, and so on — always the last day of the month.

If either condition is not met, or if the EOM convention is disabled, the `SameDay` shift returns the date unchanged.

## Weekday-Based Cycles

Not all cycles are period-based. Some contracts specify events on specific weekdays — for example, "the second Monday of every month." The `CycleAdjuster` class detects whether a cycle string represents a period or a weekday pattern and dispatches to the correct implementation.

### Period Cycle Adjuster

For period-based cycles (strings starting with "P"), the `PeriodCycleAdjuster` simply adds or subtracts the period as a `TimeSpan`:

```
PlusCycle(date) → date + period
MinusCycle(date) → date − period
```

### Weekday Cycle Adjuster

For weekday-based cycles, the string format is `[position][weekday]` — for example, "2Mon" means the second Monday. The `WeekdayCycleAdjuster` finds the nth occurrence of the target weekday in the next month:

```
PlusCycle(date):
    targetMonth = date.AddMonths(1)
    find the [position]th [weekday] in targetMonth
    if result is in the next month (overflowed), use (position-1)th instead
```

The algorithm finds the first occurrence of the target weekday in the month, then adds (position − 1) × 7 days. If the result falls into the next month (because the month doesn't have enough of that weekday), it backs up by one week.

## How Schedule Dates Become Events

The `ScheduleFactory` produces raw dates. The PAM contract processor (`PrincipalAtMaturity.Schedule()`) converts these dates into typed events:

1. Generate dates using `ScheduleFactory.CreateSchedule(anchor, maturity, cycle, eom, includeEnd)`
2. For each date, create a `ContractEvent` with:
   - `ScheduleTime` = the raw generated date
   - `Time` = `BusinessDayAdjuster.ShiftEventTime(date)` — the business-day-adjusted date
   - `Type` = the appropriate event type (IP, RR, FP, SC, etc.)
   - `Currency` = the contract's currency

The two-time design (ScheduleTime vs. Time) is critical: the ScheduleTime preserves the contractual date for calculation purposes, while Time reflects the actual settlement date after business day adjustment.

## Time Utilities

### TimeAdjuster

A utility class that rounds timestamps to the nearest full hour:

```
if minutes < 30: round down to current hour
else: round up to next hour
```

This is used to normalize timestamps that may have been stored with sub-hour precision.

### Constants

The engine defines maximum contract lifetimes to prevent unbounded schedule generation:

| Constant | Value | Description |
|---|---|---|
| MAX_LIFETIME | 50 years | Maximum duration for most contract types |
| MAX_LIFETIME_STK | 10 years | Maximum for stock-type contracts |
| MAX_LIFETIME_UMP | 10 years | Maximum for undefined maturity profiles |

## Continue Reading

- [PAM Contract](./pam-contract.md) — how the schedule is generated in the full contract pipeline
- [Conventions](./conventions/index.md) — end-of-month and business day conventions that affect schedule dates
- [State Machine](./state-machine.md) — how the generated events are evaluated
- [Technical Reference](./reference.md) — Period class, CycleUtils, and ScheduleFactory details
