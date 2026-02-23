# Testing

This document describes the test types, critical coverage areas, and how to run the tests.

See also: [Developer Guide](./developer-guide.md) | [Calculation Engine](./modules/calculation-engine.md)

---

## Business View

### Why Testing Matters

The calculation engine produces financial results used for regulatory reporting. Any error in the calculation could lead to incorrect capital requirements, fines, or reputational damage. The test suite validates that:

- The GPU results exactly match the ACTUS reference test suite.
- Monte Carlo scenario generation is reproducible (same seed → same results).
- Multi-scenario and payoff-cube outputs have the correct shape and values.
- The system behaves correctly on both GPU and CPU backends.

---

## Technical View

### Test Projects

| Project | Framework | Location |
|---|---|---|
| `ActusInsurance.Tests.GPU` | NUnit | `src/ActusInsurance.Tests.GPU/` |

### Test Files

| File | Tests | Coverage |
|---|---|---|
| `PamTestsGpu.cs` | `TestPrincipalAtMaturityV3Gpu` | GPU kernel payoff vs ACTUS reference JSON |
| `ScenarioTests.cs` | 9 tests | Monte Carlo, scenario batch, aggregation helpers |
| `PayoffCubeTests.cs` | 10 tests | PayoffCube shape, determinism, multi-calc-date, aggregation |

### Test Types

#### 1 — ACTUS Reference Tests (`PamTestsGpu.cs`)

These tests load the official ACTUS PAM test suite from `TestData/actus-tests-pam.json` (42 test cases). For each test case:

1. The contract terms and market rates are parsed from JSON.
2. `PamV3Adapter.Convert()` packs the contract and generates the event schedule.
3. `PamGpuExecutor.EvaluateBatch()` runs the GPU kernel.
4. Results are filtered (purchase date handling) and compared against the JSON expected values.

**Tolerance**: `2e-10` after rounding to 10 decimal places.

**Fields compared**: `eventType`, `eventDate`, `payoff`, `notionalPrincipal`, `accruedInterest`.

Source: `src/ActusInsurance.Tests.GPU/PamTestsGpu.cs`

#### 2 — Scenario Tests (`ScenarioTests.cs`)

| Test | What It Validates |
|---|---|
| `PriorAfterBoundaryTest` | Events before calc date use prior rate; events after use after rate |
| `DeterministicMonteCarloTest` | Same seed → identical rate series across two generator runs |
| `DifferentSeedsProduceDifferentScenarios` | Different seeds → at least one different rate |
| `RunnerShapeCorrectnessTest` | `ScenarioBatchExecutor` returns `numContracts × numScenarios` outcomes |
| `AuditMetadataIsRecorded` | `LastRunInfo` reflects actual run parameters |
| `BacktestModeTest` | When after == prior, all scenarios produce identical payoffs |
| `AggregationHelpersTest` | `ContractPayoffStats` and `ScenarioPortfolioTotal` compute correct min/max/mean/sum |
| `ScenarioRateSeriesLookupTest` | Exact match, floor fallback, and before-all-entries returns 0 |
| `MonteCarloProducesSpreadWithNonZeroVolatility` | Non-zero vol → at least one rate differs from base |
| `ZeroVolatilityProducesUnperturbedScenarios` | Zero vol → all rates equal base rates |

Source: `src/ActusInsurance.Tests.GPU/ScenarioTests.cs`

#### 3 — PayoffCube Tests (`PayoffCubeTests.cs`)

| Test | What It Validates |
|---|---|
| `Shape_K1_C2_S1_T_IsCorrect` | Cube dimensions match K=1, C=2, S=1, T=timeGrid.Count |
| `Shape_K2_C3_S5_T_IsCorrect` | Cube dimensions match K=2, C=3, S=5, T |
| `DeterministicFill_SameInputs_ProduceIdenticalCube` | Same inputs → bit-identical cube data |
| `MultiCalcDate_TwoSlices_DifferWhenCalcDateChanges` | K=2 slices differ when prior vs after rate applies |
| `TotalPayoff_MatchesScenarioBatchExecutor` | Cube total-over-T equals `ScenarioBatchExecutor` TotalPayoff |
| `OutputPlan_SingleCalcDate_HasCorrectShape` | Factory helper produces correct plan shape |
| `OutputPlan_RollingCalcDates_HasCorrectShape` | Rolling factory produces K=2 plan |
| `OutputPlan_Empty_ThrowsArgumentException` | Empty time grid throws |
| `PayoffCube_FlatIndex_OptionA_Layout` | Flat index formula is `((k*C+c)*S+s)*T+t` |
| `ContractPayoffStats_ReturnsCorrectMinMaxMean` | Stats helper returns correct min/max/mean |
| `PortfolioPayoffAt_SumsAcrossContracts` | Portfolio sum at time step equals sum of contract values |

Source: `src/ActusInsurance.Tests.GPU/PayoffCubeTests.cs`

### How to Run Tests

```bash
# Run all tests
dotnet test --configuration Release

# Run only GPU tests
dotnet test src/ActusInsurance.Tests.GPU --configuration Release

# Run with verbose output
dotnet test --configuration Release --verbosity normal
```

Tests run on the ILGPU CPU backend in CI environments where no GPU is available. This is transparent — the same code paths are exercised.

Source: `.github/workflows/preview.yml`

### Test Data

The ACTUS reference test data is at `TestData/actus-tests-pam.json`. The test project also copies this file to its output directory as a resource:

```
src/ActusInsurance.Tests.GPU/Resources/actus-tests-pam.json
```

This file contains 42 PAM test cases with contract terms, observed market data, and expected results.

### Critical Logic Coverage

| Critical Logic | Covered By |
|---|---|
| Payoff formulas (IED, IP, MD, etc.) | `PamTestsGpu.cs` — ACTUS reference suite |
| Year fraction (A365, A360, E30_360, AA) | `PamTestsGpu.cs` — test cases include multiple conventions |
| Initial state initialisation | `PamTestsGpu.cs` — tests include contracts with non-trivial StatusDate |
| Rate reset (RR) | `PamTestsGpu.cs` + `ScenarioTests.cs` — `PriorAfterBoundaryTest` |
| Prior/after rate selection | `ScenarioTests.cs` — `PriorAfterBoundaryTest`, `BacktestModeTest` |
| Monte Carlo determinism | `ScenarioTests.cs` — `DeterministicMonteCarloTest` |
| Scenario aggregation | `ScenarioTests.cs` — `AggregationHelpersTest` |
| PayoffCube shape and indexing | `PayoffCubeTests.cs` |
| Cube vs batch consistency | `PayoffCubeTests.cs` — `TotalPayoff_MatchesScenarioBatchExecutor` |

### Evidence from Code

- `src/ActusInsurance.Tests.GPU/PamTestsGpu.cs`
- `src/ActusInsurance.Tests.GPU/ScenarioTests.cs`
- `src/ActusInsurance.Tests.GPU/PayoffCubeTests.cs`
- `TestData/actus-tests-pam.json`
- `.github/workflows/preview.yml`
