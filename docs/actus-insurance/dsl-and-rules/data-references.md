---
title: Data References
description: All data namespaces available in DSL expressions — snapshot, facts, eval_date, factors, and meta.
category: ACTUS Insurance - DSL
order: 3
---

# Data References

DSL expressions can read data from five namespaces. Each is described below with the full set of available fields.

---

## `snapshot.*` — Policy snapshot fields

These come directly from the `LifeContractGpu` struct — the current state of the policy at the evaluation date.

| DSL field | Type | Description |
|---|---|---|
| `snapshot.age_at_eval` | f64 | Exact age in years at the evaluation date |
| `snapshot.sum_assured` | f64 | Death / disability benefit amount |
| `snapshot.premium_amount` | f64 | Per-payment premium |
| `snapshot.years_in_force` | f64 | Policy duration in years |
| `snapshot.extra_prem_bps` | f64 | Extra underwriting loading in basis points |
| `snapshot.lapse_count` | f64 | Number of prior lapses |
| `snapshot.claims_count` | f64 | Number of prior claims |
| `snapshot.lapse_date_days` | f64 | Date of last lapse (days since Unix epoch; −1 if never lapsed) |
| `snapshot.grace_expiry_days` | f64 | Grace period expiry date (days since Unix epoch; −1 if not in grace) |
| `snapshot.last_prem_due_days` | f64 | Date the last premium was due (days since Unix epoch) |
| `snapshot.smoker_status` | bool | `true` for smoker, `false` for non-smoker |
| `snapshot.insured_gender` | string | `"M"`, `"F"`, or `"X"` |
| `snapshot.premium_mode` | string | `"Monthly"`, `"Quarterly"`, or `"Annual"` |
| `snapshot.current_state` | string | Current Markov state name (see table below) |

### Valid `current_state` values

| Value | Description |
|---|---|
| `"Prospect"` | Application received, policy not yet issued |
| `"Active"` | Policy in force, premiums current |
| `"GracePeriod"` | Premium overdue; within grace window |
| `"Lapsed"` | Policy lapsed due to non-payment |
| `"PaidUp"` | All premiums paid; benefit still in force |
| `"ClaimOpen"` | Claim filed, pending assessment |
| `"ClaimPaid"` | Claim settled |
| `"DeathClaimPaid"` | Death claim settled; policy terminated |
| `"Reinstatement"` | Lapsed policy undergoing re-underwriting |
| `"Terminated"` | Policy permanently ended |

---

## `facts.*` — Transition context facts

These are event facts supplied at the time of a transition request. They are **not** stored on the policy — they represent what is known at this specific moment in time.

| DSL field | Type | Description |
|---|---|---|
| `facts.death_reported` | bool | True when a death notification has been received |
| `facts.claim_filed` | bool | True when a new claim has been filed |
| `facts.claim_approved` | bool | True when a pending claim has been approved |
| `facts.uw_approved` | bool | True when underwriting has returned an approval decision |
| `facts.surrender_requested` | bool | True when the policyholder has requested surrender |

Because facts are only present when explicitly supplied, guard rules should use `&&` short-circuiting to avoid referencing a facts field unless the left-hand condition is first satisfied:

```
// Safe: right side (facts.death_reported) is only read when state is "Active"
snapshot.current_state == "Active" && facts.death_reported == true
```

---

## `eval_date` — Evaluation date

The current evaluation date as days since the Unix epoch (1970-01-01). Use `months_between` to compute elapsed calendar months.

```
eval_date > snapshot.last_prem_due_days              // has premium due date passed?
months_between(snapshot.lapse_date_days, eval_date) <= 24.0  // within 24 months of lapse?
```

`eval_date` is a scalar value, not a namespace, so it is written without a dot.

---

## `$factor_id` — Computed factor references

A factor expression may reference another factor that has already been evaluated. The engine resolves factor dependencies in topological order so that each factor is guaranteed to be available when it is referenced.

```
$factor_base_mortality_qx * $factor_smoker_loading
```

An optional version suffix pins the reference to a specific rule-pack release, preventing silent behaviour changes when a rule pack is upgraded:

```
$factor_base_mortality_qx@1.0.0
```

Factor references are only valid inside **factor** expressions, not inside guard rules (factors are evaluated before guard evaluation begins, so their final values are available to the engine).

---

## `meta.*` — Product-specific metadata

For products that extend the standard contract model, a `ProductRuleSet<TMeta>` can expose arbitrary typed metadata fields under the `meta.*` namespace. These fields are provided by an `IProductMetaExtractor<TMeta>` implementation at setup time and do not require changes to the core engine.

```
meta.occupation_class          // e.g. "Standard", "HighRisk", "Excluded"
meta.zipcode                   // e.g. "90210"
meta.policy_tier               // e.g. "Gold", "Silver"
```

A typical use case is loading additional risk attributes (such as occupational class or geographic region) that are stored on the product-specific contract extension rather than on the core `LifeContractGpu` struct:

```
// Occupation exclusion guard
!contains("Excluded,HighRisk,Dangerous", meta.occupation_class)

// Region-specific rate adjustment
if meta.policy_tier == "Gold" then 0.95 else 1.0
```

The `meta.*` namespace is empty by default. If a rule references `meta.occupation_class` but no meta extractor is registered, the placeholder `{meta.occupation_class}` is left verbatim in reason templates and the field evaluates to an empty string in expressions.
