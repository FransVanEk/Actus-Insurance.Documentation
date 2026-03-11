---
title: AI Questions — Hackathon Section (Resolved)
description: Questions that were answered and incorporated into the hackathon documentation.
category: Hackathon
order: 99
---

# AI Questions — Hackathon Section

All questions below have been answered and the answers incorporated into the hackathon documents.

## Timeline & Context — Resolved

1. **Exact hackathon dates:** Started December 2025, competition deadline March 16, 2026. → Incorporated into index.md and timeline.md.

2. **Team composition:** Largely solo, with a little help from one other person. Changed all documents from "we" to "I". → Applied across all hackathon files.

3. **Hackathon organiser:** ACTUS Algorithmic Financial Contracts Use Case Competition, organised by the ACTUS Foundation. → Added to index.md.

4. **Prior experience with ACTUS:** First encounter. Introduced by Francis Gross and Willi Brammertz. No prior knowledge of Monte Carlo, projections, or financial contracts — but deep insurance domain experience. → Added to index.md and timeline.md.

## Benchmarks & Hardware — Resolved

5. **GPU hardware used:** NVIDIA GeForce RTX 3060 Ti, 8 GB. → Added to results.md.

6. **Benchmark environment:** AMD Ryzen 7 3800X 8-Core 3.90 GHz, 48 GB RAM, Windows 64-bit. → Added to results.md.

7. **Actual benchmark numbers:** Approximate numbers used pending exact BenchmarkDotNet output. Will be updated when provided.

8. **Sink implementation:** Confirmed — sinks are implemented in LifeInsurance.GPU (LifeProjectionCube with 4 channels: cashflow, probActive, probDeath, probLapsed) and in the PAM pipeline (PayoffCube with atomic accumulation). → Analogy confirmed as accurate.

## Narrative — Resolved

9. **Personal motivation:** Insurance domain experience — same challenges of accuracy and speed. → Added to index.md ("Why Insurance?" section).

10. **Biggest surprise:** The complexity of financial contract evaluation combined with the enormous performance of GPU acceleration. → Added to timeline.md ("What Surprised Me Most" section).

11. **Future plans:** Adopt the principles proven here back into the insurance domain. → Added to results.md ("What Comes Next" section).

## Scope & Accuracy — Resolved

12. **Web demo application:** Currently being worked on. CLI demo is complete. → Kept documentation focused on what exists.

13. **Company context:** Anonymous — no company named. → Maintained throughout.

14. **Car factory analogy review:** Confirmed as accurate representation. On-ramp = data packing + CPU-to-GPU transfer. Staying on highway = buffer reuse across scenarios. Sinks = structured collection and aggregation before transfer. Insurance state map = Markov graph with actuarial tables. → Analogy validated and used as central narrative.

15. **Audience:** Primary: competition judges (60s–70s, not technical). Secondary: more technical readers served by the other documentation sections. → Hackathon section kept non-technical; other sections provide technical depth.
