---
title: AI Questions — ACTUS Insurance Section (Resolved)
description: Questions resolved through codebase exploration.
category: ACTUS Insurance
order: 99
---

# AI Questions — ACTUS Insurance Section

All questions resolved through codebase exploration.

## Life Insurance — Resolved

1. **Contract types:** Life insurance via the Markov state model. Product variations expressed through DSL rule packs. → Documented.

2. **Actuarial tables:** Synthetic, built from parametric models (Gompertz-Makeham mortality, duration-based lapse, age-based disability). → Documented with formulas.

3. **Age and gender:** 61 age bands (20–80), 3 gender categories. → Documented.

4. **Premium modes:** Monthly, Quarterly, Annual. → Documented.

## DSL — Resolved

5. **DSL syntax:** Full recursive-descent parser. → Documented with grammar.

6. **Rule pack signing:** Not implemented. → Not documented.

7. **Versioning:** Multiple packs can coexist, selected by product type. → Documented.

8. **Limitations:** CPU-only setup phase, not GPU runtime. → Documented.

## Markov Model — Resolved

9. **States:** 10 states fully identified and documented.

10. **Transition matrix:** Configurable via embedded JSON. → Documented.

11. **markov_graph.json:** Structure documented.

12. **Non-life:** Not implemented. Noted as future work.

## Regulatory — Resolved

13. **IFRS 17:** Produces building blocks but not specific measurement models. → Not claimed as a feature.

14. **Solvency II:** Monte Carlo supports stress testing but no specific calculations. → Not claimed.
