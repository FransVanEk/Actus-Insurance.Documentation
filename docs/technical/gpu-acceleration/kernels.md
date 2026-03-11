---
title: GPU Kernels
description: The GPU kernel implementations — PAM single-contract, PayoffCube Monte Carlo, and Life Insurance projection.
category: Technical
order: 3
---

# GPU Kernels

## Overview

A kernel is a function that runs on the GPU with one thread per work item. This project has three main kernels, each serving a different evaluation mode.

## PAM Kernel (PamGpuKernel)

The foundational kernel. Each thread processes one contract through its full event schedule.

### Thread Assignment

Each GPU thread receives an Index1D corresponding to its contract index. The thread reads its contract's EventOffset and EventCount to locate its events in the shared event array, then processes them sequentially.

### Per-Event Processing

For each event, the kernel:

1. Computes the year fraction between the previous event and the current event using the contract's day count convention
2. Accrues interest for the elapsed period
3. Computes the payoff based on the event type
4. Updates the contract state (notional, rate, accrued amounts)
5. Writes the result to the output array

### Day Count Conventions on GPU

The kernel implements five day count conventions directly in GPU code:

| Convention | Year Fraction Calculation |
|---|---|
| A/365 (Actual/365 Fixed) | actual days / 365 |
| A/360 (Actual/360) | actual days / 360 |
| 30E/360 | (360 × Δyear + 30 × Δmonth + Δday) / 360 |
| A/336 | actual days / 336 |
| AA (Actual/Actual ISDA) | days-in-year-1 / 365-or-366 + days-in-year-2 / 365-or-366 |

Date arithmetic is performed entirely in ticks with hour-level rounding to maintain numerical stability.

### Event Type Handlers

Each event type has specific payoff and state-update logic:

| Event | Payoff | State Update |
|---|---|---|
| IED | −roleSign × notional × (1 − premiumDiscount) | Set initial notional and rates |
| IP | roleSign × (accrued + timeAccrued) × interestScaling | Reset accrued to 0 |
| IPCI | 0 | Add accrued to notional |
| RR | 0 | Update rate from market data (with cap/floor) |
| RRF | 0 | Set rate to fixed reset value |
| FP | roleSign × feeAmount | Reset fee accrued |
| SC | 0 | Update scaling multipliers |
| MD | roleSign × notional × notionalScaling | Final settlement |
| PRD | −roleSign × (notional + accrued) × scaling | Purchase transfer |
| TD | roleSign × (notional + accrued) × scaling | Termination transfer |

## PayoffCube Kernel

Extends the PAM kernel for Monte Carlo scenario evaluation with 2D thread indexing.

### Thread Assignment

Each thread receives an Index2D(contractIndex, scenarioIndex). The thread evaluates one contract under one scenario, using scenario-specific interest rates for rate-reset events.

### Scenario Rate Handling

Rates are split into two arrays: "prior" (before the calculation date) and "after" (from the calculation date forward). A calcDateIndex boundary determines which array a rate-reset event reads from. This allows the same historical rates to be shared across all scenarios while only the forward rates vary.

### Output Accumulation

Instead of writing per-event results, the PayoffCube kernel accumulates payoffs into a flat output cube indexed by [kind × contract × scenario × timeStep]. The kernel uses atomic addition to safely accumulate when multiple events map to the same time step.

### Cube Dimensions

| Dimension | Description |
|---|---|
| K (kind) | Payoff kind (currently 1: total payoff) |
| C (contracts) | Number of contracts |
| S (scenarios) | Number of Monte Carlo paths |
| T (time steps) | Number of discrete time grid points |

## Life Insurance Projection Kernel

A fundamentally different kernel that projects insurance policies through a Markov state transition model.

### Thread Assignment

Each thread processes one policy over a multi-year projection horizon (typically 30 years), stepping through monthly time increments.

### Per-Time-Step Processing

At each time step, the kernel:

1. Looks up age-adjusted mortality rate from the mortality table (Gompertz-Makeham model)
2. Applies smoker loading (1.35× for smokers) and underwriting loading
3. Looks up duration-adjusted lapse rate from the lapse table
4. Looks up disability incidence from the disability table
5. Applies competing-risk decrements (total capped at 1.0)
6. Computes expected cash flow: premium inflow − death benefit outflow
7. Updates state probabilities (probability active, death-absorbed, lapse-absorbed)

### Output Structure

Each time step produces a four-channel output:

| Channel | Description |
|---|---|
| ExpectedCashflow | Probability-weighted net cash flow |
| ProbActive | Probability the policy is still active |
| ProbDeathClaimed | Cumulative probability of death claim |
| ProbLapsed | Cumulative probability of lapse |

### Lookup Tables

Pre-built on CPU and uploaded to GPU as flat arrays:

| Table | Dimensions | Source |
|---|---|---|
| Mortality | 61 ages × 3 genders = 183 floats | Gompertz-Makeham parametric model |
| Lapse | 31 durations × 3 premium modes = 93 floats | Duration-dependent base rates |
| Disability | 61 ages × 3 genders = 183 floats | Age-dependent incidence rates |
| Markov hazards | 10 × 10 = 100 ints | State transition hazard type matrix |
