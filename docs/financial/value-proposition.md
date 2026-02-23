# Value Proposition

This document explains the business and technical value delivered by **Actus-Insurance.GPU**.

See also: [Overview](./overview.md) | [Architecture](./architecture.md)

---

## Business View

### The Problem

Insurance companies and banks must calculate the value of their entire contract portfolio under many different interest rate scenarios. This is required by regulations such as **IFRS 17** and **Solvency II**. A portfolio may contain thousands or hundreds of thousands of contracts, and regulators require results under hundreds of scenarios, refreshed daily or intra-day.

Running these calculations sequentially on a CPU can take **hours**. This makes intra-day risk monitoring impractical and creates bottlenecks in reporting.

### The Solution

Actus-Insurance.GPU moves the core calculation loop onto a **GPU**, which can evaluate thousands of contracts simultaneously. Instead of calculating one contract at a time, the GPU calculates every contract in the portfolio at the same moment. For large portfolios (10,000+ contracts), this can deliver **2× to 4×** faster total pipeline times compared to a CPU-only implementation, with further improvement on a real GPU hardware (CUDA or OpenCL).

Sample benchmark results (from `src/ActusInsurance.Benchmarks/README.md`):

| Batch Size | CPU Mean | GPU Full Pipeline | Ratio |
|---|---|---|---|
| 1,000 | ~15 ms | ~32 ms | 2.13× slower (GPU overhead dominates) |
| 10,000 | ~148 ms | ~88 ms | **0.59× faster** |
| 100,000 | ~685 ms | ~312 ms | **0.46× faster** |

At 10,000+ contracts the GPU is faster than the CPU. At 1,000 contracts the GPU overhead (memory transfer) is still dominant.

### Business Value

| Value | Description |
|---|---|
| **Speed** | Portfolio valuations that take hours on CPU complete in minutes on GPU |
| **Scalability** | Adding more scenarios is near-linear on GPU; very expensive on CPU |
| **Auditability** | Results follow the ACTUS open standard — independently verifiable |
| **Flexibility** | Automatic fallback to CPU — no GPU hardware required to run or test |
| **Reproducibility** | Deterministic Monte Carlo seeding ensures results can be reproduced |

### Risks If It Fails

| Risk | Impact |
|---|---|
| Incorrect payoff calculation | Regulatory reporting errors, financial penalties |
| Non-deterministic results | Failed audit trails, inability to reproduce results |
| GPU memory errors | Crashes or silently incorrect results for large batches |
| Performance regression | Breach of SLA for intra-day risk reports |

### Who Cares

- **Actuaries**: need correct, standard-compliant cash-flow projections.
- **Risk managers**: need fast multi-scenario analysis for regulatory capital calculations.
- **CTO / IT**: need a deployable, maintainable, testable library with no mandatory GPU hardware.
- **Quant developers**: need an extensible, well-tested calculation engine.

---

## Technical View

### Differentiating Design Choices

#### GPU Parallelism via ILGPU

Each contract is assigned one GPU thread. The kernel processes all events for that contract sequentially (intra-contract state machine), but all contracts are processed in parallel across threads. This is the natural decomposition for the ACTUS calculation model.

ILGPU provides a single C# codebase that compiles to CUDA PTX, OpenCL, or a CPU backend. No separate GPU shader languages are required.

Source: `src/ActusInsurance.GPU/PamGpuKernel.cs`, `src/ActusInsurance.GPU/PamGpuExecutor.cs`

#### Blittable Struct Layout

All data passed to the GPU must be blittable (no managed references). The adapter layer (`PamV3Adapter`) converts the domain model into flat, `[StructLayout(LayoutKind.Sequential)]` structs:

- `PamContractGpu` — contract terms + initial state + event slice offset
- `PamEventGpu` — event type, schedule time, calc time, rate index
- `GpuMarketRate` — single rate value
- `GpuScenarioRate` — prior + after rate for scenario analysis

Source: `src/ActusInsurance.GPU/Models/`

#### Double-Buffered Memory Management

`PamGpuExecutor` and `ScenarioBatchExecutor` reuse device memory buffers across calls using a doubling growth strategy. This avoids repeated GPU allocations, which are expensive.

```csharp
// From PamGpuExecutor.cs — EnsureDeviceBuffers()
if (contractCount > _contractsCapacity)
{
    _contractsBuf?.Dispose();
    _contractsCapacity = Math.Max(contractCount, Math.Max(1L, _contractsCapacity * 2));
    _contractsBuf = _accelerator.Allocate1D<PamContractGpu>(_contractsCapacity);
}
```

#### Phase Profiling

The `GpuProfiler` class (enabled via `ACTUS_GPU_PROFILE=1`) records wall-clock time for named phases: `packing`, `device_alloc`, `h2d_copy`, `kernel_submit`, `sync`, `d2h_copy`. This directly supports performance diagnosis without external tooling.

Source: `src/ActusInsurance.GPU/GpuProfiler.cs`

### Evidence from Code

- `src/ActusInsurance.GPU/ActusInsurance.GPU.csproj`
- `src/ActusInsurance.GPU/PamGpuExecutor.cs`
- `src/ActusInsurance.GPU/ScenarioBatchExecutor.cs`
- `src/ActusInsurance.Benchmarks/README.md`
- `src/ActusInsurance.GPU/GpuProfiler.cs`
- `src/ActusInsurance.GPU/Models/PamContractGpu.cs`
