# Developer Guide

This document explains how to build, run, extend, and test **Actus-Insurance.GPU**.

See also: [Architecture](./architecture.md) | [Testing](./testing.md) | [Reference](./reference.md)

---

## Running Locally

### Prerequisites

- .NET 9 SDK
- (Optional) NVIDIA GPU with CUDA drivers for GPU acceleration
- (Optional) OpenCL drivers for OpenCL acceleration

No GPU is required. The system falls back to the ILGPU CPU backend automatically.

### Build

```bash
dotnet restore
dotnet build --configuration Release
```

### Run Tests

```bash
dotnet test --configuration Release --verbosity normal
```

### Run Benchmarks

```bash
dotnet build --configuration Release
dotnet run --configuration Release --project src/ActusInsurance.Benchmarks -- --job Dry
```

See [Operations](./operations.md) for full benchmark options.

---

## Adding a Contract Type

Currently only PAM (Principal At Maturity) is fully implemented. To add a new ACTUS contract type:

### Step 1 — Add the contract kind constant

Add the new type to `GpuContractKind`:

```csharp
// src/ActusInsurance.GPU/Models/GpuContractKind.cs
public const int ANN = 1;   // Annuity (example)
```

### Step 2 — Define a new GPU contract struct (if needed)

If the new contract type has different terms from `PamContractGpu`, create a new `[StructLayout(LayoutKind.Sequential)]` struct in `src/ActusInsurance.GPU/Models/`.

For contracts similar to PAM, `PamContractGpu` may be reusable.

### Step 3 — Write a new adapter

Create an adapter (similar to `PamV3Adapter`) that:

1. Calls the CPU schedule generator for the new contract type.
2. Packs contract terms and events into GPU structs.
3. Computes initial state.

### Step 4 — Write a new kernel

Create a new static GPU kernel class (similar to `PamGpuKernel`). All methods must be static and use only blittable types. No managed memory, no I/O, no exception handling in the kernel body.

### Step 5 — Write a new executor

Create a new executor class (similar to `PamGpuExecutor`) that:

1. Holds ILGPU context and accelerator.
2. Allocates and manages device buffers.
3. Calls the kernel via `_accelerator.LoadAutoGroupedStreamKernel<...>()`.

### Step 6 — Add tests

Add test cases to `src/ActusInsurance.Tests.GPU/` following the patterns in `PamTestsGpu.cs`.

---

## Adding a Risk Factor

Risk factors are external market rates that affect contracts. To add a new risk factor type:

### Step 1 — Ensure `RiskFactorModel` supports it

The `RiskFactorModel` class (from `ActusInsurance.Core.CPU`) manages rate data. Check whether it supports the new rate type. If not, this may require a change to the upstream package.

### Step 2 — Register the rate at the correct market object code

```csharp
var riskFactors = new RiskFactorModel();
riskFactors.AddRate("MY_NEW_RATE", date, value);
// or
riskFactors.AddConstantRate("MY_NEW_RATE", value);
```

### Step 3 — Reference the market object code in the contract

Set the appropriate term on the contract (e.g., `MarketObjectCodeOfRateReset` for RR events, `MarketObjectCodeOfScalingIndex` for SC events).

### Step 4 — Verify adapter packs the rate

In `PamV3Adapter.ConvertCore()`, check that the event type is handled:

```csharp
if (ev.Type == EventType.RR && !string.IsNullOrEmpty(terms.MarketObjectCodeOfRateReset))
{
    rateIndex = allRates.Count;
    allRates.Add(new GpuMarketRate { Rate = riskFactors.GetRate(...) });
    // ...
}
```

If adding a new event type that uses a rate, add a corresponding `else if` block.

---

## Extending Calculation Logic

### Adding a New Event Type

1. Add a constant to `GpuEventType`:
   ```csharp
   public const int MYEV = 12;
   ```

2. Add a conversion case to `PamV3Adapter.ConvertEventType()`.

3. Add the payoff formula to the kernel's `switch (evType)` block.

4. Add the state transition to the second `switch (evType)` block.

5. If the event needs year-fraction accrual, add it to `NeedsAccrual()`.

6. Add tests to validate the new event type.

### Modifying a Day Count Convention

Day count logic is in `ComputeYearFraction()` in each kernel file. All three kernels (`PamGpuKernel`, `ScenarioBatchKernel`, `PayoffCubeKernel`) contain a copy of this method. Update all three to keep them in sync.

To add a new convention:

1. Add a constant to `GpuDayCountCode`.
2. Add a `case` to `ComputeYearFraction()` in all three kernel files.
3. Add the mapping in `PamV3Adapter.ConvertDayCount()`.

### Modifying the Payoff Cube

`PayoffCubeKernel` places payoffs into time-grid slots by exact tick match. To change binning behaviour (e.g., floor to the nearest grid point), modify the time-slot matching logic in `PayoffCubeKernel.Kernel()`.

---

## Adding Tests

Tests live in `src/ActusInsurance.Tests.GPU/`. The project uses NUnit.

### Adding a Reference Test

The ACTUS reference test suite is in `TestData/actus-tests-pam.json`. To add a new test case, add a JSON entry following the existing format. The `GetTestCases()` method in `PamTestsGpu.cs` automatically discovers all entries.

### Adding a Unit Test

Add a new `[Test]` method to an existing test class or create a new `[TestFixture]`. Use the shared `_executor` instance (set up in `[OneTimeSetUp]`) to avoid repeated GPU initialisation overhead.

Example structure (following `ScenarioTests.cs` style):

```csharp
[TestFixture]
public class MyNewTests
{
    private ScenarioBatchExecutor? _executor;

    [OneTimeSetUp]
    public void OneTimeSetUp()
    {
        _executor = ScenarioBatchExecutor.CreateDefault(PamV3Adapter.ConvertWithSlotInfo);
    }

    [OneTimeTearDown]
    public void OneTimeTearDown() => _executor?.Dispose();

    [Test]
    public void MyTest()
    {
        // Arrange, Act, Assert
    }
}
```

### Test Tolerance

Use `2e-10` for payoff/principal/accrued comparisons (matching the reference test tolerance).

---

## Code Conventions

- All GPU kernel types must be `[StructLayout(LayoutKind.Sequential)]` structs.
- All kernel static methods must be pure (no side effects, no I/O).
- Executors implement `IDisposable`; always dispose when done.
- Dates are stored as `long` ticks (`DateTime.Ticks`); zero means "not set / null".
- Role sign: `+1` = lender (receives interest), `−1` = borrower (pays interest).
- `FeeBasisN`: `0` = absolute fee amount, `1` = notional-based fee.

Source: `src/ActusInsurance.GPU/Models/PamContractGpu.cs`, `src/ActusInsurance.GPU/PamGpuKernel.cs`

---

## Evidence from Code

- `src/ActusInsurance.GPU/PamGpuExecutor.cs`
- `src/ActusInsurance.GPU/PamGpuKernel.cs`
- `src/ActusInsurance.GPU/PamV3Adapter.cs`
- `src/ActusInsurance.GPU/Models/GpuEventType.cs`
- `src/ActusInsurance.GPU/Models/GpuDayCountCode.cs`
- `src/ActusInsurance.GPU/Models/GpuContractKind.cs`
- `src/ActusInsurance.Tests.GPU/PamTestsGpu.cs`
- `src/ActusInsurance.Tests.GPU/ScenarioTests.cs`
- `src/ActusInsurance.Tests.GPU/PayoffCubeTests.cs`
