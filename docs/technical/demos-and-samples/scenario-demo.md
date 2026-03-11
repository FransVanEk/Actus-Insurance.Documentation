---
title: Scenario Demo — CPU vs GPU Comparison
description: A focused sample application that demonstrates CPU/GPU parity with calcDateIndex boundary handling.
category: Technical
order: 2
---

# Scenario Demo — CPU vs GPU Comparison

## Overview

The ScenarioCpuGpuCalcDateDemo is a focused sample application that demonstrates one specific capability: evaluating the same portfolio on both CPU and GPU engines and verifying that the results match. It is simpler than the full CLI tool and serves as a good starting point for understanding the evaluation pipeline.

## What It Demonstrates

1. **CPU/GPU parity** — the same contracts produce identical results on both engines
2. **CalcDateIndex handling** — how the system splits rates into "before" (historical) and "after" (forward/scenario-specific) segments
3. **CSV export** — writing results to files for external analysis

## Components

| Component | Purpose |
|---|---|
| Program.cs | Entry point — sets up contracts, scenarios, and runs both engines |
| CpuEngine | Evaluates contracts using the CPU PAM implementation |
| GpuEngine | Evaluates contracts using the GPU PAM kernel |
| RateScenarios | Generates or loads interest rate scenarios |
| CsvSink | Exports results to CSV files |

## Usage

The demo creates a small synthetic portfolio, generates a few scenarios, evaluates on both CPU and GPU, compares results, and exports to CSV. It is designed to be run as a quick verification that the GPU engine matches the CPU engine on the developer's local machine.
