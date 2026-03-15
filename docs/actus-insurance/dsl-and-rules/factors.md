---
title: Factor Definitions
description: How risk factors are structured, ordered, and evaluated — plus the complete standard factor set.
category: ACTUS Insurance - DSL
order: 5
---

# Factor Definitions

Factors are numeric intermediate values computed from policy data on the CPU before the GPU kernel runs. They capture everything that varies per policy — mortality rates, premium amounts, benefit sizes — so the GPU kernel receives pre-computed scalars and never needs to interpret DSL.

---

## Factor definition structure

Factors are defined in `factor_set.json`. Each entry looks like this:

```json
{
  "id": "factor_smoker_loading",
  "description": "Mortality loading multiplier: 1.35× for smokers, 1.0 for non-smokers",
  "expression": "if snapshot.smoker_status then 1.35 else 1.0",
  "dependencies": [],
  "cache_policy": "per_snapshot",
  "value_type": "f64"
}
```

| Field | Description |
|---|---|
| `id` | Unique factor identifier — referenced in other expressions as `$<id>` |
| `description` | Human-readable documentation |
| `expression` | DSL expression that computes the factor value |
| `dependencies` | Other factor IDs that this expression depends on; drives topological ordering |
| `cache_policy` | When to recompute: `per_snapshot` (contract changed) or `per_eval_date` (each projection step) |
| `value_type` | Always `f64` in the current release |

---

## Evaluation order

Factors are evaluated in **topological DAG order**: a factor is always evaluated only after all factors listed in its `dependencies` have already been computed. The evaluator uses Kahn's algorithm to determine this order at startup and then evaluates factors in the resulting sequence for every policy.

Each factor's computed value is stored in the `EvalContext.FactorValues` dictionary, where subsequent factors can read it via the `$factor_id` syntax. This means a factor expression like:

```
$factor_base_mortality_qx * $factor_smoker_loading * (1.0 + snapshot.extra_prem_bps / 10000.0)
```

…will always find `$factor_base_mortality_qx` and `$factor_smoker_loading` already present in the context.

---

## Standard factor set (`life-standard-factors-v1`)

The eight built-in factors for the standard term life product, listed in evaluation order.

### `factor_age`

Exact age in years at the evaluation date.

```
snapshot.age_at_eval
```

Dependencies: none

### `factor_smoker_loading`

Mortality loading multiplier based on smoking status. Applied to base mortality rates to reflect the higher risk carried by smokers.

```
if snapshot.smoker_status then 1.35 else 1.0
```

Dependencies: none

### `factor_base_mortality_qx`

Annual mortality probability (q_x) looked up from a standard 2022 Makeham-Gompertz mortality table, keyed by exact age and gender.

```
table_lookup("mortality_table_2022", (snapshot.age_at_eval, snapshot.insured_gender))
```

Dependencies: none

### `factor_adjusted_mortality_qx`

Base mortality adjusted for smoker status and any extra underwriting loading declared on the policy. `extra_prem_bps` is in basis points (1 bps = 0.01%), so 100 bps = 1% extra loading.

```
$factor_base_mortality_qx
  * $factor_smoker_loading
  * (1.0 + snapshot.extra_prem_bps / 10000.0)
```

Dependencies: `factor_base_mortality_qx`, `factor_smoker_loading`

### `factor_lapse_rate`

Annual lapse probability looked up from a duration- and payment-mode-specific table. Policies paid monthly tend to lapse more frequently than annually-paid ones.

```
table_lookup("lapse_rate_table", (snapshot.years_in_force, snapshot.premium_mode))
```

Dependencies: none

### `factor_disability_incidence`

Annual incidence rate for the disability benefit rider, looked up by age and gender and then adjusted for the smoker loading (smokers have a higher disability incidence).

```
table_lookup("disability_incidence_table", (snapshot.age_at_eval, snapshot.insured_gender))
  * $factor_smoker_loading
```

Dependencies: `factor_smoker_loading`

### `factor_benefit_amount`

The sum assured — the face value of the death or disability benefit that will be paid on a valid claim.

```
snapshot.sum_assured
```

Dependencies: none

### `factor_annual_premium`

The annualised premium — the per-payment amount scaled by the number of payments per year for the policy's payment frequency.

```
snapshot.premium_amount * premium_mode_factor(snapshot.premium_mode)
```

Examples: a monthly payer paying 150 per month → 1 800 per year; an annual payer paying 1 200 → 1 200 per year.

Dependencies: none
