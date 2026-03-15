---
title: Roadblocks — Challenges and How I Solved Them
description: The problems encountered while building the highway, and the solutions that kept the project on track.
category: Hackathon
order: 25
---

# Roadblocks — Challenges and How I Solved Them

## Overview

Building a thousand-lane highway for financial contracts is not a smooth road. Every phase of construction surfaced problems — some expected, some surprising. This document tells the story of the most significant roadblocks and how each one was cleared.

## Roadblock 1: The Comma-vs-Period Crash

**The scene:** I am running the 42 reference cars on the new track. Most pass. But a few produce wildly wrong numbers — interest rates of 525% instead of 5.25%, payment amounts off by orders of magnitude.

**What happened:** Different countries write numbers differently. In the US, "5.25" means five and a quarter. In much of Europe, "5,25" means the same thing — but with a comma. The reference data uses periods. My test computer was configured for a European locale and was silently misinterpreting the numbers.

**In car factory terms:** Imagine the test track uses metric units, but someone accidentally set the measurement instruments to imperial. The car drives perfectly, but the fuel consumption reads 5.25 gallons instead of 5.25 litres. The track is fine; the instruments are miscalibrated.

**The fix:** I locked the instruments. Every number in the system is now read using a single, fixed convention, regardless of what country the computer thinks it is in. I verified this by running all 42 reference cars under both US and European settings — identical results both times.

**Lesson:** In financial computation, even the most mundane formatting detail can produce catastrophic errors. Lock everything down.

## Roadblock 2: Cars Are Too Big for the On-Ramp

**The scene:** The highway lanes are ready. But the contracts — in their natural form — are too complex to fit on the highway. They carry text labels, date objects, variable-length event lists, and optional fields. The highway lanes only accept fixed-size, numeric data.

**In car factory terms:** The cars arrive at the on-ramp with luggage on the roof, trailers attached, custom bodywork, and passengers who each need their own seat configuration. The highway lanes are narrow and uniform — they accept only streamlined, identical shapes.

**The fix:** I built a preparation station at the on-ramp that automatically strips each car down:

| What the car carries | What it becomes on the highway |
|---|---|
| "Annual" (text label) | 12 (a number) |
| March 15, 2025 (a date object) | 638,803,... (a single number — tick count) |
| A list of 20 events (variable length) | Position 47, count 20 (index into a shared flat list) |
| Optional fields that may or may not exist | A number plus a yes/no flag |

After the highway finishes, the results — compact numbers — are translated back into business-meaningful reports. The preparation is automatic and invisible to anyone using the system.

**Lesson:** The on-ramp is the hardest engineering problem. The highway itself is straightforward — it is getting data onto and off the highway that takes real design work.

## Roadblock 3: The Highway and the Tracks Disagreed

**The scene:** I run the 42 reference cars on the highway. Most match the 8-track results exactly. But a handful differ — tiny amounts, far below a cent, but above the required 10-decimal-place tolerance.

**What happened:** Computers do arithmetic using a system that is extremely precise but not perfectly exact. Very small rounding differences can accumulate when calculations are performed in a different order — and the highway and the 8-track facility sometimes process the same sequence of operations in a slightly different order.

**In car factory terms:** Two thermometers measuring the same engine both show 92°C, but one reads 92.0000000001°C and the other reads 92.0000000003°C. For everyday purposes, they agree. For precision certification, the difference matters.

**The fix:** I identified the most sensitive calculation — the discount factor, a multiplier that converts future payments into today's values — as the one where small rounding differences accumulate most. I now compute discount factors once, on the 8-track facility (CPU), and pass them to the highway (GPU) as pre-calculated data. The highway uses the pre-calculated values instead of recomputing them, eliminating the source of drift.

Additionally, the test suite checks not just the final result of each car's run, but every individual checkpoint along the way. This catches drift at the earliest possible point, before it can accumulate.

**Lesson:** When two systems must agree to 10 decimal places, even the order of arithmetic matters. Compute the most sensitive values once and share them.

## Roadblock 4: Two Events at the Same Checkpoint

**The scene:** A reference car produces the wrong interest payment amount. Investigation reveals that an interest payment and a rate reset are both scheduled for March 1st. The question: does the interest get paid at the old rate (before the reset) or the new rate (after the reset)?

**What happened:** When two events land on the same date, the order in which they are processed changes the result. Interest payment first, then rate reset, gives a different number than rate reset first, then interest payment. The ACTUS standard defines a specific ordering, and both the 8-track facility and the highway must follow it identically.

**In car factory terms:** Two checkpoints are at the same physical location on the track. If the car passes the fuel measurement station before the engine tune-up station, you measure fuel consumption at the old engine setting. If the tune-up happens first, you measure at the new setting. The rulebook says which comes first — and both tracks must follow the same rulebook.

**The fix:** Every event type is assigned a fixed priority number. When multiple events fall on the same date, they are always processed in priority order — and that order is the same on every execution platform. The test suite includes reference cars specifically designed to catch same-day ordering errors.

**Lesson:** Edge cases where two things happen simultaneously are a classic source of bugs. Assign explicit priorities and test for them specifically.

## Roadblock 5: The On-Ramp Is Slower Than the Highway

**The scene:** I benchmark the highway against the 8-track facility. For large fleets (50,000+ cars), the highway wins handily. But for small fleets (under 5,000 cars), the 8-track facility is actually faster.

**What happened:** The on-ramp has a fixed cost — stripping down the cars, transferring them to the highway — regardless of how many cars there are. For a small fleet, this fixed cost exceeds the time the highway saves through its parallel lanes.

**In car factory terms:** Setting up the highway for a fleet of 10 cars takes longer than just running them on 8 tracks. It is like chartering a cargo plane to deliver 3 packages — the flight setup time exceeds the delivery time.

**The fix:** This is not a bug — it is a fundamental characteristic of highway computing. The system supports both execution modes. For small fleets, use the 8-track facility. For large fleets, use the highway. The crossover point is around 5,000–10,000 contracts.

| Fleet Size | Fastest Option | Why |
|---|---|---|
| Under 5,000 | 8-track facility (CPU) | On-ramp overhead exceeds highway savings |
| 5,000 – 10,000 | About equal | Crossover zone |
| Over 10,000 | Highway (GPU) | Parallel lanes dominate |
| Over 100,000 | Highway (GPU) — advantage varies by car type | 1.4–1.7× for complex banking contracts; up to 30× for insurance state-transition models |

**Lesson:** The right tool depends on the job. A highway is not better than a test track — it is better at a specific kind of job: large-scale, parallel work.

## Roadblock 6: Insurance Cars Do Not Follow Fixed Routes

**The scene:** I try to add insurance contracts to the highway. But insurance policies do not follow a pre-programmed route like a loan does. A policy can be active, then lapse, then reactivate, then enter a claim — and the path it takes depends on probabilities, not a fixed schedule.

**In car factory terms:** Banking cars follow a known route with checkpoints at fixed positions. Insurance cars arrive at intersections where they might turn left, turn right, or go straight — and the probability of each turn depends on statistical tables (mortality rates, lapse rates, disability rates). You cannot pre-programme the route.

**The fix:** Instead of trying to force insurance vehicles onto a pre-programmed route, I gave them a **state map** — a diagram of every place they might be and the probability of moving from one place to another.

At each intersection, the highway looks up the probabilities from actuarial tables and computes the **expected outcome** — the probability-weighted average across all possible paths. This is mathematically precise: given the same tables and contract terms, the expected cash flows are always exactly the same.

The critical insight: while individual paths are probabilistic, the expected (averaged) result is deterministic. This preserves the ACTUS guarantee — same inputs, same outputs — while accommodating the fundamentally different nature of insurance.

**Lesson:** Not every car follows a straight road. But you can handle uncertainty within a deterministic framework by computing expected values over all possible paths.

## Roadblock 7: The Off-Ramp Is Congested

**The scene:** The highway is running at full speed — 100,000 cars cycling through 1,000 scenarios. The problem: each car produces dozens of measurements per scenario. That is billions of data points trying to exit the highway and reach the analysis centre.

**In car factory terms:** The highway works beautifully. Cars are zooming through scenarios. But the exit road back to the analysis centre is gridlocked — too much data trying to get off the highway at the same time. The off-ramp is a bottleneck.

**The fix:** I built **sinks** — structured collection points that gather raw results and compute compact summaries. Instead of sending all raw measurements off the highway, each sink takes the 1,000 scenario results for one car and produces just a handful of numbers: the average, the spread, the best case, the worst case, and a few key risk thresholds.

Only the summary — perhaps 5 numbers per car instead of 50,000 — crosses the off-ramp. That is a 10,000× reduction in exit traffic.

(This is described in full in [Understanding CPU and GPU](./cpu-vs-gpu-explained.md), in the "Second Bottleneck: The Off-Ramp" section.)

**Lesson:** When the highway can produce data faster than the exit can handle, move the analysis as close to the source as possible. Aggregate first, transfer second.
