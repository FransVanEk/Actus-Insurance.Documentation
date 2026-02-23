# Operations

This document covers configuration, environments, profiling, logging, CI/CD, and performance considerations.

See also: [Developer Guide](./developer-guide.md) | [Architecture](./architecture.md)

---

## Business View

### What Operations Covers

Operations describes how the system is built, tested, deployed, and monitored. It answers: how do we know the system is running correctly? How do we make it faster?

The library has no server process and no database. "Operations" in this context means:

- Building and publishing the NuGet package.
- Running the automated test suite in CI.
- Profiling the GPU pipeline.
- Tuning for large batches.

---

## Technical View

### Configuration

#### Runtime Accelerator Selection

No configuration file is required. The accelerator is selected automatically at runtime:

1. CUDA (NVIDIA GPU)
2. OpenCL (any GPU or OpenCL-capable CPU)
3. ILGPU CPU backend (always available)

To override or inspect the selected accelerator:

```csharp
var executor = PamGpuExecutor.CreateDefault();
Console.WriteLine(executor.AcceleratorType);  // Cuda | OpenCL | CPU
Console.WriteLine(executor.AcceleratorName);  // Device name string
```

#### Kernel Caching

`PamGpuOptions.CacheKernel` (default: `true`) controls whether the kernel is compiled and cached at executor creation time. Setting to `false` defers compilation to the first `EvaluateBatch()` call.

```csharp
var executor = PamGpuExecutor.CreateDefault(new PamGpuOptions { CacheKernel = true });
```

Source: `src/ActusInsurance.GPU/PamGpuExecutor.cs`

### Environment Variables

| Variable | Values | Effect |
|---|---|---|
| `ACTUS_GPU_PROFILE` | `1` = enabled, any other value = disabled | Enables phase-level profiling via `GpuProfiler` |

Example:

```bash
ACTUS_GPU_PROFILE=1 dotnet run
```

Source: `src/ActusInsurance.GPU/GpuProfiler.cs`

### Profiling

When `ACTUS_GPU_PROFILE=1` is set, `GpuProfiler` records wall-clock time for each phase:

| Phase | Description |
|---|---|
| `packing` | CPU: adapter converts contract terms to GPU structs and generates event schedules |
| `device_alloc` | GPU: buffer allocation or resizing |
| `h2d_copy` | Host-to-device memory transfer |
| `kernel_submit` | GPU kernel launch |
| `sync` | Device synchronisation (waits for kernel completion) |
| `d2h_copy` | Device-to-host result download |

Output can be written as CSV or JSON:

```csharp
GpuProfiler.EmitReport();       // CSV to stdout
GpuProfiler.EmitReportJson();   // JSON to stdout
GpuProfiler.EmitReport(writer); // CSV to any TextWriter
GpuProfiler.Reset();            // Clear accumulated timings
```

Source: `src/ActusInsurance.GPU/GpuProfiler.cs`

### Logging

There is no built-in logging framework integration. The system uses no `ILogger` or console output during normal operation. The `GpuProfiler` output is the only diagnostic output and only when explicitly enabled.

### Secrets

No secrets are required at runtime. The NuGet publishing workflow uses a GitHub Actions secret:

| Secret | Use |
|---|---|
| `PKG_TOKEN` | NuGet API key for publishing to GitHub Packages |

Source: `.github/workflows/preview.yml`

### CI / CD

#### Preview Workflow

Triggered on every push to `main`:

1. Checkout repository
2. Set up .NET 9
3. `dotnet restore`
4. `dotnet build --configuration Release --no-restore`
5. `dotnet test --configuration Release --no-build --verbosity normal`
6. `dotnet pack` with version `1.0.0-preview.<run_number>`
7. Push `.nupkg` to GitHub Packages

Source: `.github/workflows/preview.yml`

#### Release Workflow

Source: `.github/workflows/release.yml` (file present but not examined in detail).

### Benchmarking

Benchmarks are in `src/ActusInsurance.Benchmarks/`. They use BenchmarkDotNet and compare CPU vs GPU performance.

```bash
# Release build (required for benchmarks)
dotnet build --configuration Release

# Run all benchmarks
dotnet run --configuration Release --project src/ActusInsurance.Benchmarks -- --filter "*"

# Dry run (1 iteration, verify setup)
dotnet run --configuration Release --project src/ActusInsurance.Benchmarks -- --job Dry

# CPU vs GPU quick comparison
dotnet run --configuration Release --project src/ActusInsurance.Benchmarks -- --filter "*CpuVsGpu*"

# GPU phase breakdown
dotnet run --configuration Release --project src/ActusInsurance.Benchmarks -- --filter "*GpuPhase*"
```

Convenience scripts are available:

```bash
./src/ActusInsurance.Benchmarks/run-benchmarks.sh quick      # Linux/macOS
.\src\ActusInsurance.Benchmarks\run-benchmarks.ps1 -Mode quick  # Windows
```

Source: `src/ActusInsurance.Benchmarks/README.md`

### Performance Considerations

#### GPU Overhead at Small Batch Sizes

The GPU pipeline has fixed overhead for memory transfer and synchronisation (~5–10 ms). At batch sizes below ~5,000 contracts, this overhead dominates and the CPU is faster. Above ~10,000 contracts, the GPU is 2–4× faster.

Source: `src/ActusInsurance.Benchmarks/README.md` — sample results table

#### Buffer Reuse

All executors reuse device memory buffers across calls. The buffer grows by doubling when the current capacity is exceeded. This amortises allocation cost over many calls. Buffers are released only on disposal.

#### Kernel Caching

Kernel compilation (JIT from C# to GPU machine code) is expensive (~1 second). With `CacheKernel = true` (default), this is done once at executor creation rather than at the first evaluation call.

#### No Result Allocation on GPU

The results buffer (`_resultsBuf`) is allocated alongside the events buffer and reused. The `PamEventResultGpu[]` array on the host side is allocated fresh on each `EvaluateBatch()` call, which is unavoidable given the return-by-value API.

#### PayoffCube Memory

The `PayoffCube.Data` array is `double[K * C * S * T]`. For large cubes (e.g., K=12, C=100,000, S=1,000, T=60) this can exceed available memory. Caller is responsible for choosing appropriate cube dimensions.

### Evidence from Code

- `src/ActusInsurance.GPU/GpuProfiler.cs`
- `src/ActusInsurance.GPU/PamGpuExecutor.cs`
- `src/ActusInsurance.GPU/ScenarioBatchExecutor.cs`
- `src/ActusInsurance.GPU/Sinks/PayoffCubeExecutor.cs`
- `src/ActusInsurance.Benchmarks/README.md`
- `.github/workflows/preview.yml`
