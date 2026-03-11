---
title: AI Questions — Background GPU Section (Resolved)
description: Questions that were answered and incorporated into the GPU background documentation.
category: Background GPU
order: 99
---

# AI Questions — Background GPU Section

All questions below have been resolved based on user answers and codebase exploration.

## Resolved

1. **Target reader technical level:** Primary audience (judges) are not technical — the hackathon section handles their needs via the car factory analogy. This section serves the secondary audience: more technically inclined readers who want to understand GPU computing concepts. → Written at an informed-but-not-expert level.

2. **Depth of CUDA/OpenCL coverage:** Conceptual level only. No code examples in this section; those belong in the technical section. → Kept at architecture and concept level.

3. **Specific GPU models used:** NVIDIA GeForce RTX 3060 Ti, 8 GB GDDR6X, 4,864 CUDA cores. CPU: AMD Ryzen 7 3800X, 8 cores, 3.90 GHz, 48 GB RAM. → Added to index.md and gpu-vs-cpu.md.

4. **ILGPU version choice:** Latest stable version at time of development. → Removed specific version number to avoid dating the documentation.

5. **GPU memory constraints:** 8 GB is sufficient for the portfolio sizes tested (up to 100K contracts). Larger institutional GPUs would support proportionally larger portfolios. → Noted in context.

6. **Multi-GPU support:** Current implementation is single-GPU only. → Not documented as a feature.

7. **Industry GPU adoption:** Not specifically referenced; the documentation focuses on the ACTUS use case. → Omitted to keep focused.

8. **Performance comparisons:** Benchmarks from the project itself are used; no external comparisons. → Covered in hackathon/results.md.
