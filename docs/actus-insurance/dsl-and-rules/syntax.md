---
title: Syntax Reference
description: DSL type system, lexical elements, operators, and conditional expressions.
category: ACTUS Insurance - DSL
order: 2
---

# DSL Syntax Reference

## Type System

The DSL is dynamically typed with three value types:

| Type | DSL Literals | Example |
|---|---|---|
| `f64` (floating-point) | Decimal or integer numbers | `1.35`, `365`, `0.0` |
| `bool` | Keywords | `true`, `false` |
| `string` | Double-quoted text | `"Active"`, `"Monthly"` |

Integer literals (`24`, `10000`) are automatically promoted to `f64` during evaluation. A non-zero `f64` is truthy in a boolean context.

---

## Lexical Elements

### Comments

Single-line comments begin with `//` and run to the end of the line. They are ignored by the lexer.

```
// This is a comment — ignored at runtime
snapshot.age_at_eval  // inline comment
```

### Literals

```
1.35          // float literal (f64)
24            // integer literal (promoted to f64)
true          // boolean literal
false         // boolean literal
"Active"      // string literal
"Monthly"     // string literal
```

### Identifiers

Plain identifiers name fields and functions (`snapshot`, `age_at_eval`, `months_between`).
Dollar-prefixed identifiers reference previously computed factors (`$factor_age`, `$factor_smoker_loading`).

```
snapshot.age_at_eval            // snapshot field reference
facts.death_reported            // facts field reference
meta.occupation_class           // product-metadata field reference
$factor_base_mortality_qx       // factor reference
$factor_base_mortality_qx@1.0.0 // factor reference pinned to a specific version
eval_date                       // built-in evaluation-date reference
```

### Supported tokens

The lexer recognises the following token kinds:

- Numeric literals — `Float` (`1.35`, `3.65e2`) and `Int` (`24`, `10000`)
- Boolean literals — `BoolTrue` and `BoolFalse`
- String literals — `String` (double-quoted)
- `Identifier` — plain names (`snapshot`, `eval_date`, `months_between`)
- `DollarIdent` — factor references (`$factor_age`)
- Keywords — `if`, `then`, `else`, `rule`, `description`, `inputs`, `guard`, `reason_template`, `priority`
- Arithmetic operators — `+`, `-`, `*`, `/`, `**`
- Comparison operators — `<`, `<=`, `>`, `>=`, `==`, `!=`
- Logical operators — `&&`, `||`, `!`
- Punctuation — `(`, `)`, `[`, `]`, `{`, `}`, `,`, `.`, `:`, `@`

---

## Operators

### Arithmetic

| Operator | Description | Example |
|---|---|---|
| `+` | Addition | `snapshot.premium_amount + 5.0` |
| `-` | Subtraction | `snapshot.sum_assured - 1000.0` |
| `*` | Multiplication | `$factor_base_mortality_qx * $factor_smoker_loading` |
| `/` | Division | `snapshot.extra_prem_bps / 10000.0` |
| `**` | Exponentiation (right-associative) | `2.0 ** 10.0` |
| `-` (unary) | Negation | `-snapshot.extra_prem_bps` |

### Comparison

All comparison operators return `bool`.

| Operator | Description | Example |
|---|---|---|
| `==` | Equality (numeric or string) | `snapshot.current_state == "Active"` |
| `!=` | Inequality | `snapshot.insured_gender != "X"` |
| `<` | Less than | `snapshot.age_at_eval < 18.0` |
| `<=` | Less than or equal | `snapshot.years_in_force <= 3.0` |
| `>` | Greater than | `eval_date > snapshot.last_prem_due_days` |
| `>=` | Greater than or equal | `snapshot.years_in_force >= 3.0` |

### Logical

| Operator | Description | Notes |
|---|---|---|
| `&&` | Logical AND (short-circuit) | Right side is skipped if left is `false` |
| `\|\|` | Logical OR (short-circuit) | Right side is skipped if left is `true` |
| `!` | Logical NOT | `!facts.death_reported` |

Short-circuit evaluation is particularly useful in guards where the right-hand side may reference a `facts.*` field that is not always present — the field is never read if the left-hand condition already determines the result.

### Operator Precedence

Operators are evaluated in the following order (lowest to highest):

| Level | Operator(s) | Associativity |
|---|---|---|
| 1 (lowest) | `if … then … else` | — |
| 2 | `\|\|` | Left |
| 3 | `&&` | Left |
| 4 | `!` | Prefix |
| 5 | `<`, `<=`, `>`, `>=`, `==`, `!=` | Left |
| 6 | `+`, `-` | Left |
| 7 | `*`, `/` | Left |
| 8 | `**` | **Right** |
| 9 (highest) | `-` (unary), literals, references, `(…)` | — |

Use parentheses to override precedence explicitly:

```
// Without parens: parsed as (a && b) || c
true && false || true

// Explicit grouping
(snapshot.current_state == "Active"
  || snapshot.current_state == "PaidUp"
  || snapshot.current_state == "ClaimOpen")
&& facts.surrender_requested == true
```

---

## Conditional Expressions

The `if … then … else` construct evaluates one of two branches based on a boolean condition:

```
if <condition> then <value-if-true> else <value-if-false>
```

Only the matching branch is evaluated (short-circuit). Examples:

```
// Smoker loading: 1.35× for smokers, 1.0 for non-smokers
if snapshot.smoker_status then 1.35 else 1.0

// Clamp a value to zero when negative
if snapshot.extra_prem_bps > 0.0 then snapshot.extra_prem_bps else 0.0
```

`if … then … else` has the lowest precedence of all operators, so the condition and both branches are parsed fully before the conditional is resolved. Nesting is allowed but parentheses are recommended for clarity:

```
if snapshot.smoker_status
  then (if snapshot.insured_gender == "M" then 1.50 else 1.35)
  else 1.0
```
