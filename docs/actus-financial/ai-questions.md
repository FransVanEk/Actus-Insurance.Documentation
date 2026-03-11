---
title: AI Questions — ACTUS Financial Section (Resolved)
description: Questions resolved through codebase exploration.
category: ACTUS Financial
order: 99
---

# AI Questions — ACTUS Financial Section

All questions resolved through codebase exploration.

## Scope — Resolved

1. **ACTUS specification version:** Implementation follows the current ACTUS taxonomy for PAM. Reference tests are sourced from the official ACTUS test suite. → Referenced without pinning to a specific version.

2. **Contract type coverage plan:** PAM is implemented. Other types can be added via the IContractScheduler interface. → Documented as extensible.

3. **Deviation from specification:** No intentional deviations discovered. All 42 reference tests pass to 10 decimal places. → Documented as fully conformant for PAM.

## Event System — Resolved

4. **Custom event types:** Fixed to the ACTUS standard (12 types). → Documented.

5. **Event filtering:** Events before StatusDate are excluded. Pre-purchase events filtered in GPU comparison. → Documented.

## Risk Factors — Resolved

6. **Risk factor interpolation:** Last observation carried forward only. → Documented.

7. **Risk factor types:** Interest rates only. → Documented as extensible.

8. **Market data sources:** Synthetic Vasicek generator + CSV loading. → Documented.

## Conventions — Resolved

9. **Holiday calendars:** NC and MF implemented. MFH placeholder without specific holiday data. → Documented.

10. **Missing conventions:** All PAM-relevant conventions implemented (verified by 42 tests). → Documented.
