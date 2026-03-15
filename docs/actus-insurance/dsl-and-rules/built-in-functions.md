---
title: Built-in Functions
description: Reference for the four built-in DSL functions — months_between, premium_mode_factor, contains, and table_lookup.
category: ACTUS Insurance - DSL
order: 4
---

# Built-in Functions

The DSL provides four built-in functions that cover the most common actuarial operations. All functions return `f64` unless noted otherwise.

---

## `months_between(from_days, to_days)`

Computes the approximate number of calendar months between two dates expressed as days since the Unix epoch (1970-01-01). Uses 30.4375 days per month (= 365.25 ÷ 12).

**Returns:** `f64`

```
months_between(snapshot.lapse_date_days, eval_date)
// → positive if lapse was in the past; negative if lapse_date_days is in the future
```

Typical use — check whether a lapsed policy is still within the 24-month reinstatement window:

```
months_between(snapshot.lapse_date_days, eval_date) <= 24.0
```

Note: `snapshot.lapse_date_days` is −1 when the policy has never lapsed, so guards that use this function should first check that `snapshot.lapse_date_days >= 0.0`:

```
snapshot.lapse_date_days >= 0.0
  && months_between(snapshot.lapse_date_days, eval_date) <= 24.0
  && snapshot.lapse_count <= 2.0
```

---

## `premium_mode_factor(mode)`

Returns the number of premium payments per year for a given payment frequency. Accepts either the string name or the numeric code.

**Returns:** `f64`

| Argument | Numeric code | Return value |
|---|---|---|
| `"Monthly"` | `0` | `12.0` |
| `"Quarterly"` | `1` | `4.0` |
| `"Annual"` | `2` | `1.0` |

Typical use — compute the annualised premium from the per-payment amount:

```
snapshot.premium_amount * premium_mode_factor(snapshot.premium_mode)
// → e.g. 150.0 * 12.0 = 1800.0 for a monthly payer
```

---

## `contains(collection, item)`

Tests whether `item` is a member of a comma-separated string list. Returns `bool`.

**Returns:** `bool`

Comparison is **case-insensitive** and whitespace around commas is trimmed.

```
contains("Excluded,HighRisk,Dangerous", "HighRisk")    // → true
contains("Excluded , HighRisk , Dangerous", "highrisk") // → true  (trimmed + case-insensitive)
contains("Excluded,Dangerous", "Standard")              // → false
```

Typical use — check whether an insured's occupation class falls into an excluded category:

```
// Guard: policy may only be issued if the occupation is not excluded
!contains("Excluded,HighRisk,Dangerous", meta.occupation_class)
```

Or with a soft-loading rule:

```
// Apply a higher loading for occupations in the hazardous list
if contains("Hazardous,HighRisk", meta.occupation_class) then 1.25 else 1.0
```

---

## `table_lookup(table_id, (key1, key2, …))`

Performs an N-dimensional lookup in a named actuarial table. The table must be registered in the rule pack under the given `table_id`. Keys can be any mix of `f64` and `string` values.

**Returns:** `f64`

```
// 1. Annual mortality probability (qx) — age × gender table
table_lookup("mortality_table_2022", (snapshot.age_at_eval, snapshot.insured_gender))

// 2. Annual lapse rate — policy duration × payment mode table
table_lookup("lapse_rate_table", (snapshot.years_in_force, snapshot.premium_mode))

// 3. Disability incidence rate — age × gender table
table_lookup("disability_incidence_table", (snapshot.age_at_eval, snapshot.insured_gender))
```

### How it works

The engine resolves the named table from the rule pack's embedded lookup table registry. For numeric keys the lookup interpolates between adjacent table rows (linear interpolation by default). For string keys the lookup matches an exact row.

### Table naming convention

Table identifiers use the pattern `<table_name>_<year>` so that actuarial basis updates are tracked by name:

```
"mortality_table_2022"      // 2022 mortality basis
"mortality_table_2024"      // 2024 update — swap here to change the basis
"lapse_rate_table"
"disability_incidence_table"
```

A custom `ILookupTableProvider` can be injected into the evaluator to override tables at test time or to substitute environment-specific actuarial bases without changing the DSL expressions.
