---
title: Scenario split
description: The split in the scenario definition
category: ACTUS Insurance
order: 2
---

# Scenario: Design Reasoning & Philosophy

*Context: `ActusInsurance.Tests.GPU / ScenarioTests.cs`*

---

## Why Scenarios Exist

A large insurance or financial portfolio is never truly "known" — it is a projection forward in time from a fixed vantage point. Interest rates will move, prepayment speeds will shift, and credit spreads will widen or tighten in ways that no model can predict with certainty. The purpose of scenario testing is not to find the single correct answer but to understand the **distribution of possible futures** and, crucially, to understand how well yesterday's predictions match today's reality.

---

## The Central Idea: A Moving Knowledge Boundary

Every projection is made from a **calculation date** (`calculationDate`). This date is the dividing line between what is known and what is uncertain:

- **Before the calculation date** — these events have already happened. The rate resets, coupon payments, and principal repayments that fall in this region are **facts**. They happened; the market has recorded them.
- **On or after the calculation date** — these events have not happened yet. They are **predictions**. The model applies scenario rates to estimate their value.

This boundary is enforced at the data level through the `ScenarioRateSeries` dual-value structure. Every time point in a scenario carries two independent rates:

```
(prior rate, after rate)  →  keyed by tick timestamp
```

When the system evaluates a rate-reset event (`RR`), it looks up whether that event falls before or after the calculation date and selects the appropriate value. Events in the past use the `prior` rate; events in the future use the `after` rate. The lookup itself uses the closest earlier entry as a fallback, so a single early-dated entry acts as a blanket override for the entire series.

---

## What Makes Predictions Go Stale

Consider a projection made on **2022-01-01** for a five-year floating-rate portfolio. The model picks scenario rates for 2022–2027. Those rates feel reasonable at the time.

By **2023-01-01**, one year of reality has elapsed. The rates the model chose for 2022 are now facts — and they almost certainly do not match the scenarios exactly. If the model is never updated, its predictions for 2023–2027 are still anchored to the 2022 view of the world: they have **gone stale**.

Staleness has two dimensions:

1. **Temporal drift** — the longer time passes, the more "factual" history diverges from what the old scenarios assumed, eroding trust in the forward projections.
2. **Regime drift** — a structural shift (e.g. an abrupt rate-hiking cycle) can render the entire distributional shape of future scenarios implausible, not just their level.

Keeping the prior and after values separate is what makes it possible to detect and measure staleness. You can re-run the same portfolio with a new calculation date and new scenarios while leaving the historical portion unchanged, so differences in outcome are attributable purely to updated forward assumptions rather than to recomputed history.

---

## Multiple Scenario Vintages: Measuring Adaptability

The most powerful insight comes not from running a single scenario set but from running **several sets anchored at different calculation dates** and comparing them.

Imagine three projection vintages:

| Vintage | Calculation Date | Forward Assumption |
|---------|-----------------|-------------------|
| V₁ | 2021-01-01 | Rates stay low through 2025 |
| V₂ | 2022-07-01 | Rates rise 200 bps by 2023 |
| V₃ | 2023-01-01 | Rates plateau at elevated level |

The `PayoffCube` captures this naturally. Its four-dimensional structure is indexed as:

```
cube[k, c, s, t]
  k = calc-date slice (vintage index)
  c = contract index
  s = scenario index within that vintage
  t = time-step on the shared output grid
```

When you align the slices along the time axis you can answer the question: **"At time t, how close was vintage Vₙ's prediction to the subsequent factual outcome?"**

If V₁ predicted that the portfolio would accrue interest at 2 % throughout 2022 but V₂ — already partially informed by reality — predicted 4 %, and the actual 2022 cash flows were at 4 %, then V₂ adapted well and V₁ failed to. This comparison is only possible because the prior/after boundary keeps historical facts frozen while allowing the forward assumptions to change between vintages.

In code this is expressed through `OutputPlan.RollingCalcDates`, which schedules the same portfolio to be evaluated once for each vintage:

```csharp
var plan = OutputPlan.RollingCalcDates(
    new[] { calcDate2021, calcDate2022, calcDate2023 },
    timeGrid);
var cube = executor.Execute(contracts, rf, scenarioSet, plan);
```

---

## Backtest Mode: Asserting the Past

When `after == prior` for every time point in a `ScenarioRateSeries`, the scenario contains **no forward uncertainty**. All events, past and future, use the same rate. This is **backtest mode**.

Backtest mode is useful in two situations:

1. **Regression testing** — fixing all rates to their known historical values should reproduce deterministic cash-flow schedules that match reference data exactly.
2. **Baseline anchoring** — before stressing the portfolio with hypothetical rate paths, you establish a "what actually happened" baseline. The difference between the backtest payoff and a stressed payoff is the pure scenario delta, with no noise from recomputing history.

The `BacktestModeTest` verifies the invariant: if every scenario in a set has `after == prior`, then all scenarios must produce identical payoffs regardless of how many there are, because there is no variation to exploit.

---

## Monte Carlo Scenarios: Sampling the Forward Distribution

Rather than hand-crafting individual rate paths, `MonteCarloScenarioGenerator` samples a distribution of future rates by perturbing the base `after` values with log-normal noise. The `prior` values are left unchanged — consistent with the rule that the factual past is not touched by forward uncertainty.

Key design choices:

- **Seed determinism** — the same seed always produces the same set of paths. This means that adding a new scenario or changing a contract definition does not silently invalidate the reproducibility of existing runs. It also makes CI/CD comparisons stable.
- **Zero-volatility degeneracy** — with `volatility = 0`, every scenario collapses to the base after-rate path. This is the Monte Carlo equivalent of a deterministic forecast and acts as a natural sanity check.
- **Independent prior and after** — the generator perturbs only the `after` values. The `prior` series is kept at its base, ensuring that historical consistency is never broken by sampling variance.

---

## The Portfolio Runner and Output Shape

The `ScenarioBatchExecutor` is the workhorse for a single calculation-date evaluation. It returns a flat array of `ScenarioOutcome` objects with shape `[numContracts × numScenarios]`, laid out so that all scenarios for contract `c` occupy a contiguous block starting at `c * numScenarios`. This layout makes it efficient to compute per-contract statistics (min, max, mean payoff across scenarios) using `ScenarioOutcomeAggregator.ContractPayoffStats`.

When multiple calculation dates are involved, `PayoffCubeExecutor` replaces the batch executor. Instead of a flat scalar per `(contract, scenario)` pair, it produces a full time-series of payoffs for each combination, forming the four-dimensional cube described above. Both executors share the same GPU kernel path through `PamV3Adapter` and `ScenarioBatchExecutor`, so numerical results are consistent across the two surfaces.

---

## Summary of the Design

The scenario architecture is built around one governing insight: **the boundary between fact and prediction is not fixed in time — it advances as the world unfolds.** By encoding this boundary explicitly in every rate series, separating it from the contract terms, and making it movable through the choice of calculation date, the system enables a kind of institutional memory: you can always re-run an old projection, compare it to the new one, and quantify exactly how much your assumptions have improved — or failed to improve — in the intervening period.

```
Past ──────────────|──────────────── Future
        FACTS      │      PREDICTIONS
                   │
             calculationDate
              (movable)
```

This is not merely a testing concern. It is the foundation for any credible forward-looking risk analysis: know what you know, be honest about what you are guessing, and always be able to show your work as time moves on.
