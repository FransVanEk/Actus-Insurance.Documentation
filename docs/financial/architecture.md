# Architecture

This document describes the component architecture, data flow, technology stack, and design constraints of **Actus-Insurance.GPU**.

See also: [Overview](./overview.md) | [Domain Model](./domain-model.md) | [Calculation Engine](./modules/calculation-engine.md)

---

## Business View

### How the System Is Organised

The system has four layers:

1. **Domain model** — financial contract terms and market data (from the ACTUS standard).
2. **Adapter layer** — translates the domain model into a format the GPU can read.
3. **GPU computation layer** — runs the actual calculations in parallel.
4. **Output layer** — collects and organises the results.

Think of the adapter as a translator between the financial world and the computing world. The GPU layer is the fast calculator. The output layer formats the answers.

The system always falls back to a CPU calculator if no GPU is available, so it runs in every environment including developer laptops and CI servers.

---

## Technical View

### Component Diagram

```
flowchart TD
    A[PamContractTerms plus RiskFactorModel]
    B[PamV3Adapter]
    C[GPU Structs]
    D1[PamGpuExecutor]
    D2[ScenarioBatchExecutor]
    D3[PayoffCubeExecutor]
    E1[PamGpuKernel]
    E2[ScenarioBatchKernel]
    E3[PayoffCubeKernel]
    F[Results]
    A --> B
    B --> C
    C --> D1
    C --> D2
    C --> D3
    D1 --> E1
    D2 --> E2
    D3 --> E3
    E1 --> F
    E2 --> F
    E3 --> F
```

**Legend**:
- `PamContractTerms`, `RiskFactorModel` — defined in `ActusInsurance.Core.CPU`
- `GPU Structs` — blittable structs: `PamContractGpu`, `PamEventGpu`, `GpuMarketRate`, `GpuScenarioRate`
- Executors manage device lifecycle and buffer allocation
- Kernels run on GPU (or CPU fallback)

### Projects

| Project | Type | Purpose |
|---|---|---|
| `ActusInsurance.GPU` | Library | Core library — all executors, kernels, adapters, models |
| `ActusInsurance.Tests.GPU` | Test | NUnit tests for GPU correctness |
| `ActusInsurance.Benchmarks` | Benchmark | BenchmarkDotNet CPU vs GPU performance comparisons |
| `ActusInsurance.PortfolioRunner` | Library | High-level facade (`PamPortfolioRunner`) |

Source: `Actus-Insurance-GPU.slnx`

### Technology Stack

| Technology | Version | Role |
|---|---|---|
| .NET | 9.0 | Target framework |
| ILGPU | 1.5.3 | GPU abstraction — CUDA, OpenCL, CPU backend |
| ActusInsurance.Core.CPU | 1.0.0-preview.2 | Schedule generation and domain model |
| NUnit | (from test project) | Unit and integration testing |
| BenchmarkDotNet | (from benchmarks project) | Performance benchmarking |

Source: `src/ActusInsurance.GPU/ActusInsurance.GPU.csproj`

### Accelerator Selection

At startup, executors attempt to acquire a GPU in priority order:

```csharp
// From PamGpuExecutor.CreateDefault()
accelerator = TryCreateAccelerator(context, AcceleratorType.Cuda);
if (accelerator == null)
    accelerator = TryCreateAccelerator(context, AcceleratorType.OpenCL);
if (accelerator == null)
    accelerator = context.CreateCPUAccelerator(0);
```

Exceptions from unavailable backends are silently caught. The CPU accelerator is always available.

### Memory Model

All device buffers are `MemoryBuffer1D<T, Stride1D.Dense>` — one-dimensional, densely packed. For 2D data (scenarios × contracts), the flat index is computed explicitly:

```
// ScenarioOutcome layout: outcomes[contractIndex * numScenarios + scenarioIndex]
// PayoffCube layout:      cube[((k * C + c) * S + s) * T + t]
```

Buffers are reused across calls using a doubling growth strategy (never shrink). Each executor holds its own set of buffers and is disposed when no longer needed.

Source: `PamGpuExecutor.cs`, `ScenarioBatchExecutor.cs`, `Sinks/PayoffCubeExecutor.cs`

### Data Flow — Single Batch

```
flowchart TD
    T1[Pack structs - CPU]
    T2[Alloc device buffers]
    T3[H2D copy]
    T4[Launch kernel]
    T5[Synchronise]
    T6[D2H copy]
    T7[Return results]
    T1 --> T2
    T2 --> T3
    T3 --> T4
    T4 --> T5
    T5 --> T6
    T6 --> T7
```

When `ACTUS_GPU_PROFILE=1`, each phase (`packing`, `device_alloc`, `h2d_copy`, `kernel_submit`, `sync`, `d2h_copy`) is timed separately.

### Kernel Index Model

| Kernel | Index type | Parallelism |
|---|---|---|
| `PamGpuKernel` | `Index1D` | One thread per contract |
| `ScenarioBatchKernel` | `Index2D (c, s)` | One thread per contract-scenario pair |
| `PayoffCubeKernel` | `Index2D (c, s)` | One thread per contract-scenario pair, per calc date |

### Thread-Level State Machine

Each GPU thread executes a sequential event loop for its assigned contract(s). This is a deliberate intra-contract sequential + inter-contract parallel design. The state machine tracks:

- `notionalPrincipal`
- `nominalInterestRate`
- `accruedInterest`
- `feeAccrued`
- `notionalScalingMultiplier`
- `interestScalingMultiplier`
- `prevCalcTimeTicks`

State transitions are driven by event type (IED, IP, IPCI, RR, RRF, FP, SC, MD, TD, PRD).

Source: `PamGpuKernel.cs`, `ScenarioBatchKernel.cs`

### Constraints

- All kernel parameter types must be blittable (no managed references, no strings, no arrays-of-arrays).
- `DateTime` values are passed as `long` ticks.
- Day count convention and event type are passed as `int` constants.
- The GPU kernel must be pure (no I/O, no logging).
- GPU allocations are never freed until the executor is disposed or a larger buffer is needed.

### Evidence from Code

- `src/ActusInsurance.GPU/PamGpuExecutor.cs`
- `src/ActusInsurance.GPU/PamGpuKernel.cs`
- `src/ActusInsurance.GPU/ScenarioBatchExecutor.cs`
- `src/ActusInsurance.GPU/ScenarioBatchKernel.cs`
- `src/ActusInsurance.GPU/Sinks/PayoffCubeExecutor.cs`
- `src/ActusInsurance.GPU/Sinks/PayoffCubeKernel.cs`
- `src/ActusInsurance.GPU/GpuProfiler.cs`
- `src/ActusInsurance.GPU/ActusInsurance.GPU.csproj`
