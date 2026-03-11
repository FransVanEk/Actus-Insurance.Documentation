---
title: AI Questions — Technical Section (Resolved)
description: Questions resolved through codebase exploration and user answers.
category: Technical
order: 99
---

# AI Questions — Technical Section

All questions below have been resolved through codebase exploration and user-provided context.

## Core Engine — Resolved

1. **Contract types beyond PAM:** PAM is the only fully implemented ACTUS contract type. The architecture supports adding others (LAM, NAM, ANN) via the same IContractScheduler interface. → Documented as PAM-only with extensible design.

2. **Thread safety:** StateSpace uses copy-by-value semantics. ContractEvent evaluation is per-contract with no shared mutable state. Both CPU (parallel via Task) and GPU (per-thread) execution are inherently thread-safe. → No additional documentation needed.

3. **Error handling:** The engine assumes valid input (contract terms pass ACTUS schema validation). Invalid inputs produce undefined results. → Documented as a prerequisite assumption.

## GPU Implementation — Resolved

4. **ILGPU compilation:** First kernel compilation takes hundreds of milliseconds. The executor caches the compiled kernel for reuse. → Documented in executors.md.

5. **GPU profiling:** Enabled via ACTUS_GPU_PROFILE=1 environment variable. Instruments H2D, kernel, D2H phases. → Documented in executors.md.

6. **Maximum tested portfolio:** 100,000 contracts on RTX 3060 Ti (8 GB). No stability issues observed. Larger GPUs would support proportionally more. → Documented in context.

## Demo Tools — Resolved

7. **Web demo:** Currently being developed. CLI demo is the primary demonstration tool. → Documented CLI only; web demo noted as in progress.

8. **CLI output format:** CSV and JSON. → Documented in cli-tool/index.md.

9. **Sample data realism:** Synthetic portfolios with randomised but plausible parameters. No real market data included. → Documented as synthetic with deterministic seeding.

## Testing — Resolved

10. **Test coverage:** 42 PAM reference tests are the primary correctness tests. Individual convention implementations are tested implicitly through the reference tests. → Documented.

11. **Performance regression tests:** Benchmarks run manually via BenchmarkDotNet. No automated CI regression testing. → Documented.

12. **CI/CD pipeline:** Not documented — focus is on local development and test execution. → Omitted.
