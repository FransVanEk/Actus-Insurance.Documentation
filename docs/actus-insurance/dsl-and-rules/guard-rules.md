---
title: Guard Rules
description: How transition guard rules are structured and the complete standard rule set.
category: ACTUS Insurance - DSL
order: 6
---

# Guard Rules

Guard rules express boolean conditions that must be satisfied before a Markov state transition is permitted. They gate every event that changes a policy's state — premium lapses, death claims, reinstatements, surrenders, and more.

---

## Guard rule structure

Guard rules are defined in `rule_set.json`. Each entry looks like this:

```json
{
  "id": "rule_death_benefit_eligible",
  "description": "Death claim allowed when policy is Active and death is reported",
  "inputs": ["snapshot.current_state", "facts.death_reported"],
  "guard": "snapshot.current_state == \"Active\" && facts.death_reported == true",
  "reason_template": "State {snapshot.current_state}; death reported: {facts.death_reported}.",
  "priority": 100
}
```

| Field | Description |
|---|---|
| `id` | Unique rule identifier, passed to `EvaluateGuard` |
| `description` | Human-readable documentation |
| `inputs` | Data fields the guard reads; captured in `GuardResult.InputsUsed` for audit |
| `guard` | DSL boolean expression; must evaluate to `true` for the transition to proceed |
| `reason_template` | Message template interpolated at evaluation time (see below) |
| `priority` | When multiple rules apply to the same transition, the highest priority wins |

---

## Reason templates

The `reason_template` string is interpolated using `{…}` placeholders. Any `snapshot.*`, `facts.*`, `meta.*`, or `eval_date` reference is resolved to its runtime value. Unresolved placeholders are left verbatim in the output.

```
"Underwriting approved: {facts.uw_approved}; must be true to proceed."
"Premium due day {snapshot.last_prem_due_days}; eval day {eval_date}."
"Lapse day {snapshot.lapse_date_days}; lapse count {snapshot.lapse_count}."
"State {snapshot.current_state}; death reported: {facts.death_reported}."
```

The rendered reason is returned as `GuardResult.Reason` and is useful for logging transition decisions and building human-readable audit trails.

---

## `GuardResult`

`EvaluateGuard` returns a `GuardResult` with three fields:

| Field | Type | Description |
|---|---|---|
| `Allowed` | `bool` | Whether the guard passed |
| `Reason` | `string` | Rendered reason template |
| `InputsUsed` | `Dictionary<string, string>` | Values of all declared inputs at evaluation time |

`InputsUsed` gives full provenance: you can see exactly what values the engine read when it made its decision.

---

## Standard guard rule set (`life-standard-rules-v1`)

All ten built-in guard rules, in priority order.

### `rule_death_benefit_eligible` (priority 100)

Death claim permitted when the policy is in `Active` state and a death notification has been received.

```
snapshot.current_state == "Active" && facts.death_reported == true
```

### `rule_claim_approved` (priority 80)

A claim in `ClaimOpen` state transitions to `ClaimPaid` when the claim has been formally approved.

```
snapshot.current_state == "ClaimOpen" && facts.claim_approved == true
```

### `rule_claim_admissible` (priority 50)

A general claim is admitted when the policy is `Active` and a claim has been filed.

```
snapshot.current_state == "Active" && facts.claim_filed == true
```

### `rule_surrender` (priority 30)

Surrender is allowed from `Active`, `PaidUp`, or `ClaimOpen` states when the policyholder requests it.

```
(snapshot.current_state == "Active"
  || snapshot.current_state == "PaidUp"
  || snapshot.current_state == "ClaimOpen")
&& facts.surrender_requested == true
```

### `rule_reinstatement_eligible` (priority 20)

A lapsed policy may apply for reinstatement if the lapse occurred within the past 24 months and the policy has lapsed no more than twice before.

```
snapshot.lapse_date_days >= 0.0
  && months_between(snapshot.lapse_date_days, eval_date) <= 24.0
  && snapshot.lapse_count <= 2.0
```

### `rule_reinstatement_approved` (priority 20)

A policy in `Reinstatement` state transitions back to `Active` after successful re-underwriting.

```
snapshot.current_state == "Reinstatement" && facts.uw_approved == true
```

### `rule_underwriting_approved` (priority 10)

A policy may only be issued (transition from `Prospect` to `Active`) when underwriting has returned an approval decision.

```
facts.uw_approved == true
```

### `rule_paid_up_eligible` (priority 10)

A policy may convert to paid-up status only after the minimum 3-year premium-paying term has been completed.

```
snapshot.current_state == "Active" && snapshot.years_in_force >= 3.0
```

### `rule_premium_overdue` (priority 5)

Triggers the transition from `Active` to `GracePeriod` when the last premium due date has passed.

```
eval_date > snapshot.last_prem_due_days && snapshot.current_state == "Active"
```

### `rule_grace_period_expired` (priority 5)

Triggers a lapse when the grace period window has expired without a premium payment.

```
snapshot.grace_expiry_days > 0.0 && eval_date > snapshot.grace_expiry_days
```

---

## Adding a custom guard rule

To add a new rule, append an entry to `rule_set.json`:

```json
{
  "id": "rule_age_limit",
  "description": "Policy cannot be issued if insured age exceeds 65",
  "inputs": ["snapshot.age_at_eval"],
  "guard": "snapshot.age_at_eval <= 65.0",
  "reason_template": "Insured age {snapshot.age_at_eval} must be <= 65 for new issues.",
  "priority": 15
}
```

No engine changes are needed. The rule pack is reloaded automatically on next startup.
