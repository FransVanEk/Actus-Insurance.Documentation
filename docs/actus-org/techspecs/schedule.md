---
title: Schedule Generation
description: How the ACTUS specification defines event schedule generation — cycle notation, stub handling, and the ordering of events.
category: ACTUS Organization — Technical Specifications
order: 4
source: https://github.com/actusfrf/actus-techspecs
---

# Schedule Generation

## Purpose

The ACTUS Technical Specification defines a deterministic schedule generation algorithm for each contract type. Given a set of contract terms, the algorithm produces an ordered sequence of contract events — each with a timestamp and event type — that represents all contractual obligations over the lifetime of the contract.

## Schedule as the Core Output

The schedule is the primary artifact from which cash flows and state transitions are derived. An engine implementing the specification processes events in schedule order: for each event, it calls the payoff function (POF) to compute the cash flow and the state transition function (STF) to update the contract state.

## Cycle Notation

Contract terms include cycle definitions that specify the frequency and behavior of recurring events. The specification defines a standard cycle notation:

`P[n][unit]L[stub]`

Where:
- `P` — period prefix (ISO 8601 duration convention)
- `[n]` — the number of units per cycle period
- `[unit]` — the time unit: `D` (days), `W` (weeks), `M` (months), `Q` (quarters), `H` (half-years), `Y` (years)
- `L` — stub indicator prefix
- `[stub]` — stub type: `0` for a long stub at the start or end, `1` for a short stub

For example, `P3ML0` means a quarterly cycle (3 months) with a long stub.

## Schedule Construction

For each event type that has a cycle defined in the contract terms, the schedule generation algorithm:

1. Takes the cycle anchor date (start of the schedule)
2. Applies the cycle period repeatedly up to the maturity or termination date
3. Adjusts each generated date according to the applicable end-of-month convention
4. Applies business day adjustment using the specified business day convention and calendar
5. Handles stub periods at the beginning or end of the schedule

## Business Day and Calendar Conventions

The specification defines conventions for adjusting dates that fall on non-business days:

- The **Business Day Convention** specifies how to shift a scheduled date to the nearest business day: following, modified following, preceding, modified preceding, and others.
- The **Calendar** identifies which days are business days.
- The **End-of-Month Convention** governs whether cycles anchored at the end of a month continue to generate end-of-month dates.
- The **Calc/Shift** convention determines whether accrual periods are calculated before or after date adjustment.

## Day Count Conventions

Interest accrual between events depends on the elapsed time measured according to a day count convention. The specification defines several day count conventions that are standard in the financial industry, specifying how the number of days and the year basis are calculated between two dates.

## Event Priority

When multiple event types generate events at the same date, the specification defines an event sequence indicator — a priority order that determines which event is processed first. This is critical because the state at t⁻ passed to a later event depends on all earlier events at the same timestamp having already been processed.
