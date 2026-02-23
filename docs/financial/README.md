# Actus-Insurance.GPU Documentation

This folder contains the complete documentation for the **Actus-Insurance.GPU** library — a GPU-accelerated ACTUS financial contract calculation engine built on [ILGPU](https://ilgpu.net/).

## Quick Navigation

| Document | Audience | Description |
|---|---|---|
| [Overview](./overview.md) | Both | System purpose, workflows, and main components |
| [Value Proposition](./value-proposition.md) | Business | Why this system exists and the business value it delivers |
| [Architecture](./architecture.md) | Technical | Component diagram, data flow, and technology choices |
| [Domain Model](./domain-model.md) | Both | Core financial concepts and data structures |
| [Contracts Module](./modules/contracts.md) | Both | What a contract is, its lifecycle, and how it is executed |
| [Calculation Engine](./modules/calculation-engine.md) | Technical | GPU kernels, formulas, algorithms, and invariants |
| [Risk Factors Module](./modules/risk-factors.md) | Both | Market rates, Monte Carlo scenarios, and fallback logic |
| [Testing](./testing.md) | Technical | Test types, coverage, and how to run tests |
| [Operations](./operations.md) | Technical | Configuration, CI/CD, profiling, and performance |
| [Developer Guide](./developer-guide.md) | Technical | How to build, extend, and contribute |
| [Reference](./reference.md) | Technical | Data models, public API, folder map, and type index |

## About This Project

**Actus-Insurance.GPU** implements the [ACTUS financial contract standard](https://www.actusfrf.org/) with GPU acceleration for high-throughput portfolio analytics. It supports the **Principal At Maturity (PAM)** contract type and provides:

- Single-contract batch evaluation (`PamGpuExecutor`)
- Monte Carlo scenario batch evaluation (`ScenarioBatchExecutor`)
- Multi-calc-date payoff cube construction (`PayoffCubeExecutor`)

## Evidence from Code

Files used as primary sources for this documentation index:

- `src/ActusInsurance.GPU/ActusInsurance.GPU.csproj`
- `src/ActusInsurance.GPU/PamGpuExecutor.cs`
- `src/ActusInsurance.GPU/ScenarioBatchExecutor.cs`
- `src/ActusInsurance.GPU/Sinks/PayoffCubeExecutor.cs`
- `src/ActusInsurance.Benchmarks/README.md`
