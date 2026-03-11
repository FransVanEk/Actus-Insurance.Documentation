---
title: Running Tests
description: How to execute the test suites and interpret the results.
category: Technical
order: 2
---

# Running Tests

## Prerequisites

- .NET 9.0 SDK installed
- For GPU tests: NVIDIA GPU with CUDA support (or tests will fall back to CPU backend)

## Running CPU Tests

The CPU tests are in the ActusInsurance.Tests.CPU project:

```
cd Actus-Insurance.Core
dotnet test
```

This runs all 42 PAM reference tests against the CPU engine. Each test loads a case from `actus-tests-pam.json`, evaluates it, and compares against expected results.

## Running GPU Tests

The GPU tests are in the ActusInsurance.Tests.GPU project:

```
cd Actus-Insurance.GPU
dotnet test
```

This runs the same 42 PAM reference tests through the GPU pipeline (adapter → executor → kernel → results) and verifies against the same expected values. It also runs the life insurance projection tests.

If no NVIDIA GPU is available, ILGPU automatically falls back to the CPU backend. The tests still pass — they just run slower.

## Interpreting Results

A successful run shows all tests passing:

- 42 PAM tests × 2 engines (CPU + GPU) = 84 total PAM test executions
- Life insurance projection tests (variable count)

Any failure indicates a correctness regression. The test output shows which specific test case failed and which event produced a different value, making it straightforward to identify the root cause.

## Tolerance

The comparison tolerance is **2×10⁻¹⁰** (0.0000000002). This is:

- Tight enough to catch: rounding errors in day count fractions, event ordering mistakes, incorrect rate cap/floor application, and state update bugs
- Loose enough to accommodate: inherent IEEE 754 double-precision rounding differences between CPU and GPU arithmetic

## Running Benchmarks

Performance benchmarks use BenchmarkDotNet:

```
cd Actus-Insurance.GPU
dotnet run -c Release --project src/ActusInsurance.Benchmarks
```

This produces detailed timing statistics for CPU vs GPU evaluation at various portfolio sizes, including warm-up, iteration counts, and statistical analysis.
