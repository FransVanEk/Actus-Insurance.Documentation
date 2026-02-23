# System Overview

This document describes the purpose, key workflows, main components, and boundaries of **Actus-Insurance.GPU**.

See also: [Architecture](./architecture.md) | [Domain Model](./domain-model.md) | [Value Proposition](./value-proposition.md)

---

## Business View

### What This System Does

Actus-Insurance.GPU calculates the financial cash flows and risk exposures of a portfolio of financial contracts — very quickly and at scale.

The calculations follow the **ACTUS** (Algorithmic Contract Types Unified Standards) open standard, which defines precise mathematical rules for every type of financial contract. This means the results are predictable, auditable, and consistent with the international standard.

### Why It Exists

Insurance companies and banks hold large portfolios of financial contracts. To meet regulatory requirements (such as IFRS 17 and Solvency II) they must re-value these portfolios under hundreds or thousands of different interest rate scenarios every day. On a regular CPU this can take hours. By running the same calculation on a Graphics Processing Unit (GPU), which can perform thousands of operations in parallel, the same calculation can complete in seconds or minutes.

### Key Business Workflows

1. **Portfolio valuation** — evaluate every contract in a portfolio under a single set of market rates.
2. **Scenario analysis** — evaluate every contract under many rate scenarios at once (Monte Carlo).
3. **Rolling valuations** — generate a full payoff cube across multiple calculation dates and scenarios.

### Who Cares About It

- **Actuaries** — need accurate, reproducible cash-flow projections.
- **Risk managers** — need fast scenario analysis for regulatory reporting.
- **Quantitative developers** — need a correct, extensible calculation framework.
- **IT operations** — need a deployable, configurable service.

---

## Technical View

### System Purpose

Actus-Insurance.GPU is a .NET 9 class library that:

1. Converts high-level ACTUS `PamContractTerms` objects (from the `ActusInsurance.Core.CPU` package) into blittable GPU structs.
2. Uploads these structs to a GPU (CUDA, OpenCL, or ILGPU CPU fallback).
3. Executes a GPU kernel that processes every contract in parallel.
4. Downloads results back to managed memory.

### Main Components

| Component | File | Responsibility |
|---|---|---|
| `PamGpuExecutor` | `PamGpuExecutor.cs` | Device lifecycle, buffer management, single-batch evaluation |
| `PamGpuKernel` | `PamGpuKernel.cs` | Core PAM calculation kernel (runs on GPU) |
| `PamV3Adapter` | `PamV3Adapter.cs` | Converts domain model to GPU structs, packs events and rates |
| `ScenarioBatchExecutor` | `ScenarioBatchExecutor.cs` | Multi-scenario execution using `ScenarioBatchKernel` |
| `ScenarioBatchKernel` | `ScenarioBatchKernel.cs` | 2D kernel: contracts × scenarios |
| `PayoffCubeExecutor` | `Sinks/PayoffCubeExecutor.cs` | Multi-calc-date payoff cube construction |
| `PayoffCubeKernel` | `Sinks/PayoffCubeKernel.cs` | Writes payoffs into 4D cube by time-grid slot |
| `MonteCarloScenarioGenerator` | `Models/MonteCarloScenarioGenerator.cs` | Generates log-normal rate scenarios using XorShift64 PRNG |
| `GpuProfiler` | `GpuProfiler.cs` | Phase-level timing (enabled via env var) |
| `PamPortfolioRunner` | `PortfolioRunner/PamPortfolioRunner.cs` | High-level facade for portfolio evaluation |

### Key Workflows

#### 1 — Single Batch Evaluation

```
PamContractTerms[] contracts
RiskFactorModel    riskFactors
         │
         ▼
  PamV3Adapter.Convert()
  ─ generates event schedules (via ActusInsurance.Core.CPU)
  ─ packs: PamContractGpu[], PamEventGpu[], GpuMarketRate[]
         │
         ▼
  PamGpuExecutor.EvaluateBatch()
  ─ uploads structs to device (H2D)
  ─ launches PamGpuKernel (one thread per contract)
  ─ synchronises device
  ─ downloads PamEventResultGpu[] (D2H)
```

#### 2 — Scenario Batch Evaluation

```
contracts + riskFactors + ScenarioSet
         │
         ▼
  PamV3Adapter.ConvertWithSlotInfo()
  ─ packs contracts, events, base market rates
  ─ returns RateSlotInfo[] mapping events → market object codes
         │
         ▼
  ScenarioBatchExecutor.EvaluateScenarioBatch()
  ─ builds GpuScenarioRate[numScenarios × numBaseRateSlots]
  ─ launches ScenarioBatchKernel(Index2D: contracts × scenarios)
  ─ returns ScenarioOutcome[numContracts × numScenarios]
```

#### 3 — Payoff Cube

```
contracts + riskFactors + ScenarioSet + OutputPlan
         │
         ▼
  PayoffCubeExecutor.Execute()
  ─ for each calc date k:
      ─ build scenario rates for this k
      ─ launch PayoffCubeKernel → writes into cube[k, c, s, t]
  ─ return PayoffCube[K, C, S, T]
```

### System Boundaries

- **Inputs**: `PamContractTerms`, `RiskFactorModel`, `ScenarioSet`, `OutputPlan` — all defined in or based on `ActusInsurance.Core.CPU`.
- **Outputs**: `PamEventResultGpu[]`, `ScenarioOutcome[]`, `PayoffCube` — GPU-computed results.
- **External dependency**: `ActusInsurance.Core.CPU` NuGet package (schedule generation, domain model).
- **GPU runtimes**: CUDA, OpenCL, or ILGPU CPU backend — selected automatically at runtime.
- **No persistence layer**: results are returned in memory; persistence is the caller's responsibility.
- **No HTTP API**: this is a library, not a service.

### External Integrations

| Dependency | Version | Role |
|---|---|---|
| `ActusInsurance.Core.CPU` | `1.0.0-preview.2` | Schedule generation and domain model |
| `ILGPU` | `1.5.3` | GPU abstraction layer (CUDA, OpenCL, CPU) |

Source: `src/ActusInsurance.GPU/ActusInsurance.GPU.csproj`

### Evidence from Code

- `src/ActusInsurance.GPU/PamGpuExecutor.cs`
- `src/ActusInsurance.GPU/PamGpuKernel.cs`
- `src/ActusInsurance.GPU/PamV3Adapter.cs`
- `src/ActusInsurance.GPU/ScenarioBatchExecutor.cs`
- `src/ActusInsurance.GPU/ScenarioBatchKernel.cs`
- `src/ActusInsurance.GPU/Sinks/PayoffCubeExecutor.cs`
- `src/ActusInsurance.GPU/Sinks/PayoffCubeKernel.cs`
- `src/ActusInsurance.GPU/Models/MonteCarloScenarioGenerator.cs`
- `src/ActusInsurance.GPU/GpuProfiler.cs`
- `src/ActusInsurance.PortfolioRunner/PamPortfolioRunner.cs`
