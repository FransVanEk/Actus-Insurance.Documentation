# Reference

This document provides a concise index of data models, public APIs, folder structure, and important types.

See also: [Domain Model](./domain-model.md) | [Architecture](./architecture.md) | [Developer Guide](./developer-guide.md)

---

## Folder Map

```
Actus-Insurance.GPU/
├── docs/                              # This documentation
│   ├── README.md
│   ├── overview.md
│   ├── value-proposition.md
│   ├── architecture.md
│   ├── domain-model.md
│   ├── testing.md
│   ├── operations.md
│   ├── developer-guide.md
│   ├── reference.md
│   └── modules/
│       ├── contracts.md
│       ├── calculation-engine.md
│       └── risk-factors.md
├── src/
│   ├── ActusInsurance.GPU/            # Main library
│   │   ├── Contracts/
│   │   │   └── PamConvertWithSlotInfoDelegate.cs
│   │   ├── Models/
│   │   │   ├── GpuContractKind.cs
│   │   │   ├── GpuDayCountCode.cs
│   │   │   ├── GpuEventType.cs
│   │   │   ├── GpuMarketRate.cs
│   │   │   ├── GpuScenarioRate.cs
│   │   │   ├── MonteCarloScenarioGenerator.cs
│   │   │   ├── PamContractGpu.cs
│   │   │   ├── PamEventGpu.cs
│   │   │   ├── PamEventResultGpu.cs
│   │   │   ├── ScenarioOutcome.cs
│   │   │   └── ScenarioSet.cs
│   │   ├── Sinks/
│   │   │   ├── OutputPlan.cs
│   │   │   ├── OutputSink.cs
│   │   │   ├── PayoffCube.cs
│   │   │   ├── PayoffCubeExecutor.cs
│   │   │   ├── PayoffCubeKernel.cs
│   │   │   └── SinkKind.cs
│   │   ├── GpuProfiler.cs
│   │   ├── PamGpuExecutor.cs
│   │   ├── PamGpuKernel.cs
│   │   ├── PamV3Adapter.cs
│   │   ├── ScenarioBatchExecutor.cs
│   │   └── ScenarioBatchKernel.cs
│   ├── ActusInsurance.Tests.GPU/      # NUnit tests
│   │   ├── PamTestsGpu.cs
│   │   ├── PayoffCubeTests.cs
│   │   └── ScenarioTests.cs
│   ├── ActusInsurance.Benchmarks/     # BenchmarkDotNet benchmarks
│   │   ├── BenchmarkData.cs
│   │   ├── JsonTestDataLoader.cs
│   │   ├── PamComparisonBenchmarks.cs
│   │   ├── PamV3GpuBenchmarks.cs
│   │   ├── Program.cs
│   │   ├── README.md
│   │   ├── run-benchmarks.ps1
│   │   └── run-benchmarks.sh
│   └── ActusInsurance.PortfolioRunner/# High-level facade
│       └── PamPortfolioRunner.cs
└── TestData/
    └── actus-tests-pam.json           # 42 ACTUS PAM reference test cases
```

---

## Data Models

### GPU Structs (in `ActusInsurance.GPU.Models`)

| Type | Layout | Purpose |
|---|---|---|
| `PamContractGpu` | Sequential | Contract terms + initial state + event/rate slice indices |
| `PamEventGpu` | Sequential | Single scheduled event (type, times, rate index) |
| `PamEventResultGpu` | Sequential | Per-event kernel output (payoff, state variables) |
| `GpuMarketRate` | Sequential | Single rate value for the single-scenario kernel |
| `GpuScenarioRate` | Sequential | Prior + after rate for scenario kernels |
| `ScenarioOutcome` | Sequential | Per-contract-scenario result (total payoff, final state) |

### Scenario Model

| Type | Description |
|---|---|
| `ScenarioSet` | Collection of scenarios with a shared calculation date |
| `Scenario` | One rate path: `Dictionary<string, ScenarioRateSeries>` keyed by market object code |
| `ScenarioRateSeries` | Time series of `(prior, after)` rate pairs; floor-interpolated lookup |
| `RateSlotInfo` | Maps a rate slot index to its market object code and event time ticks |

### Output Types

| Type | Description |
|---|---|
| `PayoffCube` | 4D array: `[K calc dates, C contracts, S scenarios, T time steps]` |
| `OutputPlan` | Specifies calc dates, time grid, and output sinks for `PayoffCubeExecutor` |
| `OutputSink` | Identifies an output target (`SinkKind`: PayoffCube, PvScalar, Components) |

---

## Public API

### `PamGpuExecutor`

```csharp
// Factory
public static PamGpuExecutor CreateDefault(PamGpuOptions? options = null)

// Properties
public string AcceleratorName { get; }
public AcceleratorType AcceleratorType { get; }

// Single-step execution
public PamEventResultGpu[] EvaluateBatch(
    PamContractGpu[] gpuContracts,
    PamEventGpu[]    gpuEvents,
    GpuMarketRate[]  gpuRates)

// Two-phase execution
public int UploadAndExecute(
    PamContractGpu[] gpuContracts,
    PamEventGpu[]    gpuEvents,
    GpuMarketRate[]  gpuRates)

public PamEventResultGpu[] DownloadResults(int eventCount)

public void Dispose()
```

Source: `src/ActusInsurance.GPU/PamGpuExecutor.cs`

### `ScenarioBatchExecutor`

```csharp
public static ScenarioBatchExecutor CreateDefault(
    PamConvertWithSlotInfoDelegate converter)

public string AcceleratorName { get; }
public ScenarioBatchRunInfo LastRunInfo { get; }

public ScenarioOutcome[] EvaluateScenarioBatch(
    IReadOnlyList<PamContractTerms> contracts,
    RiskFactorModel                 riskFactors,
    ScenarioSet                     scenarioSet,
    DateTime                        maturityDate)

public void Dispose()
```

Source: `src/ActusInsurance.GPU/ScenarioBatchExecutor.cs`

### `PayoffCubeExecutor`

```csharp
public static PayoffCubeExecutor CreateDefault(
    PamConvertWithSlotInfoDelegate converter)

public string AcceleratorName { get; }

public PayoffCube Execute(
    IReadOnlyList<PamContractTerms> contracts,
    RiskFactorModel                 riskFactors,
    ScenarioSet                     scenarioSet,
    OutputPlan                      plan)

public void Dispose()
```

Source: `src/ActusInsurance.GPU/Sinks/PayoffCubeExecutor.cs`

### `PamV3Adapter`

```csharp
public static void Convert(
    IReadOnlyList<PamContractTerms> contractTerms,
    RiskFactorModel riskFactors,
    DateTime maturityDate,
    out PamContractGpu[] gpuContracts,
    out PamEventGpu[]    gpuEvents,
    out GpuMarketRate[]  gpuRates)

public static void ConvertWithSlotInfo(
    IReadOnlyList<PamContractTerms> contractTerms,
    RiskFactorModel riskFactors,
    DateTime maturityDate,
    out PamContractGpu[]  gpuContracts,
    out PamEventGpu[]     gpuEvents,
    out GpuMarketRate[]   gpuRates,
    out RateSlotInfo[]    rateSlotInfo)
```

Source: `src/ActusInsurance.GPU/PamV3Adapter.cs`

### `MonteCarloScenarioGenerator`

```csharp
public static ScenarioSet Generate(
    DateTime calculationDate,
    IReadOnlyDictionary<string, IReadOnlyDictionary<long, double>> basePriorRates,
    IReadOnlyDictionary<string, IReadOnlyDictionary<long, double>> baseAfterRates,
    int    numScenarios,
    double volatility,
    ulong  seed)
```

Source: `src/ActusInsurance.GPU/Models/MonteCarloScenarioGenerator.cs`

### `GpuProfiler`

```csharp
public static readonly bool IsEnabled;           // true when ACTUS_GPU_PROFILE=1
public static ProfileScope Start(string phase)   // returns IDisposable scope
public static void Reset()
public static void EmitReport(TextWriter? output = null)     // CSV format
public static void EmitReportJson(TextWriter? output = null) // JSON format
```

Source: `src/ActusInsurance.GPU/GpuProfiler.cs`

### `PamPortfolioRunner`

```csharp
public PamPortfolioRunner(PamGpuOptions? options = null)

public PamEventResultGpu[] EvaluateBatch(
    IReadOnlyList<PamContractTerms> contracts,
    RiskFactorModel riskFactors,
    DateTime maturityDate)

public void Dispose()
```

Source: `src/ActusInsurance.PortfolioRunner/PamPortfolioRunner.cs`

### `ScenarioOutcomeAggregator`

```csharp
public static (double min, double max, double mean) ContractPayoffStats(
    ScenarioOutcome[] outcomes,
    int contractIndex,
    int numScenarios)

public static double ScenarioPortfolioTotal(
    ScenarioOutcome[] outcomes,
    int scenarioIndex,
    int numContracts,
    int numScenarios)
```

Source: `src/ActusInsurance.GPU/Models/ScenarioOutcome.cs`

---

## Constants

### `GpuEventType`

| Constant | Value | ACTUS Name |
|---|---|---|
| `IED` | 0 | Initial Exchange |
| `IP` | 1 | Interest Payment |
| `IPCI` | 2 | Interest Payment Capitalisation |
| `PRD` | 3 | Purchase |
| `TD` | 4 | Termination |
| `RR` | 5 | Rate Reset (variable) |
| `RRF` | 6 | Rate Reset (fixed) |
| `FP` | 7 | Fee Payment |
| `SC` | 8 | Scaling |
| `MD` | 9 | Maturity |
| `AD` | 10 | Analysis Date |
| `CD` | 11 | Credit Default |

### `GpuDayCountCode`

| Constant | Value | Convention |
|---|---|---|
| `A365` | 0 | Actual/365 |
| `A360` | 1 | Actual/360 |
| `E30_360` | 2 | 30E/360 |
| `AA` | 3 | Actual/Actual ISDA |
| `B252` | 4 | Business days/252 |
| `A336` | 5 | Actual/336 |

---

## CLI Commands

### Build

```bash
dotnet restore
dotnet build --configuration Release
```

### Test

```bash
dotnet test --configuration Release --verbosity normal
```

### Benchmark

```bash
dotnet run --configuration Release \
  --project src/ActusInsurance.Benchmarks \
  -- --filter "*"
```

### Pack NuGet

```bash
dotnet pack --configuration Release \
  -p:Version="1.0.0-preview.1" \
  --output ./nupkgs
```

---

## Important Types Summary

| Type | Namespace | Description |
|---|---|---|
| `PamGpuExecutor` | `ActusInsurance.GPU` | Main executor for single-scenario batch evaluation |
| `ScenarioBatchExecutor` | `ActusInsurance.GPU` | Multi-scenario batch executor |
| `PayoffCubeExecutor` | `ActusInsurance.GPU.Sinks` | Multi-calc-date payoff cube executor |
| `PamV3Adapter` | `ActusInsurance.GPU` | Converts CPU domain model to GPU structs |
| `PamGpuKernel` | `ActusInsurance.GPU` | Single-scenario GPU kernel |
| `ScenarioBatchKernel` | `ActusInsurance.GPU` | Multi-scenario GPU kernel |
| `PayoffCubeKernel` | `ActusInsurance.GPU.Sinks` | Payoff cube GPU kernel |
| `PamContractGpu` | `ActusInsurance.GPU.Models` | GPU contract struct |
| `PamEventGpu` | `ActusInsurance.GPU.Models` | GPU event struct |
| `PamEventResultGpu` | `ActusInsurance.GPU.Models` | GPU event result struct |
| `ScenarioOutcome` | `ActusInsurance.GPU.Models` | Per-contract-scenario result |
| `ScenarioSet` | `ActusInsurance.GPU.Models` | Collection of rate scenarios |
| `MonteCarloScenarioGenerator` | `ActusInsurance.GPU.Models` | Log-normal scenario generator |
| `GpuProfiler` | `ActusInsurance.GPU` | Phase-level performance profiler |
| `PayoffCube` | `ActusInsurance.GPU.Sinks` | 4D payoff result cube |
| `OutputPlan` | `ActusInsurance.GPU.Sinks` | Execution plan for PayoffCubeExecutor |
| `PamPortfolioRunner` | `ActusInsurance.PortfolioRunner` | High-level portfolio evaluation facade |
