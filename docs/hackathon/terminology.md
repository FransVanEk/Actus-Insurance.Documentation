---
title: Terminology & Glossary
description: Reference glossary of all key terms, abbreviations, and concepts used throughout the documentation.
category: Hackathon
order: 99
---


This document defines every term, abbreviation, and concept used across the documentation. When a term appears for the first time in any document, it links back here. Use this page as a reference whenever you encounter an unfamiliar concept.

## A

### ACTUS

**Algorithmic Contract Types Unified Standards.** An open standard that defines financial contracts as deterministic algorithms. Each contract type is specified by a set of contract terms, a schedule of events, and a state machine that computes cash flows. ACTUS was created to bring transparency and consistency to financial contract modeling.

### ACTUS-I

The insurance extension of the ACTUS standard. ACTUS-I introduces new contract types for life insurance, non-life insurance, annuities, and parametric insurance, while reusing the core ACTUS computational model (event-driven, deterministic state transitions).

### Accrued Interest

The amount of interest that has accumulated on a financial contract since the last interest payment date but has not yet been paid out. In the ACTUS state machine, accrued interest is tracked continuously and reset to zero after each interest payment event (IP).

### Actuarial Table

A lookup table that maps demographic or risk factors — such as age, gender, and policy duration — to probability values such as mortality rates, lapse rates, and disability rates. Actuarial tables are derived from population or industry experience data. In the projection engine, they are queried at each monthly time step to determine the hazard rates that drive state transitions in the Markov Graph.

### AoS (Array of Structures)

A data layout where each object (e.g., a financial contract) is stored as a single contiguous block of memory containing all its fields. This is the natural layout in object-oriented programming. Compare with SoA.

## B

### Blittable Struct

A data structure whose in-memory representation is identical in managed (.NET) and unmanaged (GPU) memory. Blittable structs contain no managed references (no strings, arrays, or object pointers) and can be copied directly as raw bytes between CPU and GPU memory without marshaling overhead.

### BenchmarkDotNet

A .NET library for writing and running performance benchmarks. Used in this project to measure CPU vs. GPU execution times across different portfolio sizes.

### Business Day Convention

A rule that determines how a scheduled event date is adjusted when it falls on a non-business day (weekend or holiday). Examples include Following (move to the next business day), Modified Following (move forward unless it crosses a month boundary), and Preceding (move to the previous business day).

## C

### Calc Date Index

An integer representing a point in time on the scenario time grid. Events occurring before this index use historically observed rates ("prior rates"), while events at or after this index use scenario-generated rates ("after rates"). This enables backtesting and what-if analysis.

### Cash Flow

A payment that occurs as the result of a financial contract event. Cash flows can be positive (money received) or negative (money paid). In ACTUS, every event either produces a cash flow (its payoff) or is administrative (zero payoff).

### Contract Event

A discrete occurrence in the life of a financial contract that may change the contract state and/or produce a cash flow. Examples: Initial Exchange Date (IED), Interest Payment (IP), Maturity Date (MD), Rate Reset (RR).

### Contract Role

Defines the perspective from which a contract is evaluated. The two primary roles are RPA (receive principal at maturity) and RPL (pay principal at maturity). The role determines the sign of cash flows: what is an inflow for one party is an outflow for the other.

### Contract State

The set of variables that fully describe a financial contract at a given point in time. For a PAM contract, the state includes: notional principal, nominal interest rate, accrued interest, fee accrued, scaling multipliers, status date, and contract performance status.

### CUDA

**Compute Unified Device Architecture.** NVIDIA's proprietary parallel computing platform and API that allows software to use NVIDIA GPUs for general-purpose computing (not just graphics). CUDA provides the highest performance for GPU computation on NVIDIA hardware.

## D

### Day Count Convention

A rule that specifies how the number of days between two dates is converted into a year fraction for interest calculations. Different conventions produce slightly different year fractions. Common conventions include:

| Convention | Description |
|---|---|
| A/360 | Actual days divided by 360 |
| A/365 | Actual days divided by 365 |
| A/A ISDA | Actual days divided by actual days in year |
| 30E/360 | European 30/360 method |
| B/252 | Business days divided by 252 |

### Deterministic Execution

A computation that, given the same inputs, always produces exactly the same outputs. This property is critical for financial contract evaluation because results must be auditable, reproducible, and independently verifiable.

### Discount Factor

A multiplier (between 0 and 1) that converts a future cash flow into its present value. If the short rate at time t is r(t), the discount factor is DF(t) = exp(-sum of r(i) * dt for i from 0 to t). A discount factor of 0.95 means that a cash flow one year from now is worth 95% of its face value today.

### D2H (Device-to-Host)

The transfer of results from GPU memory (device) back to CPU memory (host) after computation completes. D2H transfer travels over the PCIe bus and is a key cost factor in GPU-accelerated pipelines. The sink architecture minimises D2H data volume by aggregating results on the device before transfer.

### DSL (Domain-Specific Language)

A small programming language designed for a specific purpose. In this project, the DSL is used to define insurance product rules (premium calculations, claim eligibility, state transitions) without modifying the core engine code.

## E

### Event Schedule

The complete, ordered list of events that will occur during the lifetime of a financial contract. Generated from the contract terms (start date, maturity date, payment cycles, etc.). The schedule is deterministic: given the same terms, the same schedule is always produced.

### Event Type

A classification of contract events. Each type has specific payoff and state-update logic. The ACTUS PAM event types are:

| Code | Name | Description |
|---|---|---|
| IED | Initial Exchange Date | Contract starts; principal is exchanged |
| MD | Maturity Date | Contract ends; principal is returned |
| IP | Interest Payment | Periodic interest is paid |
| IPCI | Interest Capitalization | Accrued interest is added to principal |
| RR | Rate Reset | Interest rate is updated from market data |
| RRF | Rate Reset Fixed | Interest rate is reset to a fixed value |
| FP | Fee Payment | A fee is paid |
| SC | Scaling | Notional or interest scaling is updated |
| PRD | Purchase Date | Contract is purchased by a new party |
| TD | Termination Date | Contract is terminated early |
| CD | Credit Default | A credit event occurs |

### Expected Shortfall (ES)

A risk metric that measures the average loss in the worst-case tail of a distribution beyond the VaR threshold. ES95 measures the average loss across the worst 5% of scenarios; ES99 measures the average loss across the worst 1%. Unlike VaR, which only identifies the loss threshold, Expected Shortfall quantifies how severe losses in the tail actually are. Also known as Conditional Value at Risk (CVaR). ES95 and ES99 are reported as output statistics in the CLI portfolio projection tool.

## F

### Floating Rate

An interest rate that changes over time according to market conditions, typically referencing a benchmark index (e.g., EURIBOR or an overnight rate). In ACTUS, floating-rate contracts include periodic Rate Reset events (RR) that update the nominal interest rate by querying the Risk Factor Model at the reset date. Contrast with a fixed rate, which remains constant throughout the contract's life.

## G

### Gompertz-Makeham Model

A parametric mortality model where the force of mortality (instantaneous death rate) increases exponentially with age: μ(x) = A + B × C^x (equivalently, A + B × exp(x × ln C)). The parameter A represents an age-independent background mortality, B and C together describe the exponential increase with age. Widely used in actuarial science. In this project, it provides the base mortality rates for the life insurance projection kernel.

### Grace Period

A defined window of time after a missed premium payment during which an insurance policy remains in force. During the grace period, the policyholder can pay the overdue premium and reinstate the policy to Active status. If the grace period expires without payment, the policy lapses. Represented as a distinct state in the Markov Graph, with transitions to Active (premium paid) or Lapsed (grace expired).

### GPU (Graphics Processing Unit)

A processor originally designed for rendering graphics, now widely used for parallel computation. A GPU contains thousands of small cores that can execute the same operation on many data elements simultaneously. This makes GPUs well-suited for evaluating large portfolios of financial contracts in parallel.

## H

### H2D (Host-to-Device)

The transfer of data from CPU memory (host) to GPU memory (device). This is a necessary step before GPU computation can begin. The speed of H2D transfer, which is limited by PCIe bandwidth, is a key factor in overall GPU pipeline performance.

### Hazard Rate

The instantaneous rate of transition from one state to another in a Markov model. In life insurance, hazard rates include mortality rate (death), lapse rate (policy cancellation), and disability rate. Hazard rates vary by age, gender, duration, and other risk factors.

## I

### IFRS 17

An international accounting standard for insurance contracts, effective from January 2023. IFRS 17 requires insurance companies to measure contracts using discounted, probability-weighted cash flow projections, making computational efficiency critical.

### ILGPU

An open-source .NET library that provides a unified API for GPU programming. ILGPU abstracts over CUDA, OpenCL, and CPU backends, allowing the same kernel code to run on NVIDIA GPUs, AMD GPUs, or as a CPU fallback.

## K

### Kernel (GPU)

A function that runs on the GPU. Each kernel is executed by thousands of GPU threads simultaneously. In this project, each GPU thread processes one financial contract (or one contract-scenario pair), evaluating all events sequentially within that thread.

## L

### Lapse Rate

The proportion of insurance policies in a given cohort that are cancelled or surrendered by policyholders within a defined period. Lapse rates are typically modelled as a function of policy duration and are provided as actuarial table inputs to the Markov projection engine. Together with mortality rate and disability rate, lapse rate is one of the primary hazard rates governing policy state transitions.

### LINS (Life Insurance)

A proposed ACTUS-I contract type for life insurance policies, covering term life, whole life, and universal life products.

## M

### Markov Graph

A directed graph where nodes represent states (e.g., Active, Lapsed, Claim Pending, Death Claimed) and edges represent possible transitions. Each edge has a probability (hazard rate) that determines the likelihood of transitioning from one state to another in a given time step. Used in the insurance extension for policy lifecycle modeling.

### Monte Carlo Simulation

A computational technique that uses random sampling to estimate numerical results. In this project, Monte Carlo simulation generates many possible interest-rate paths (scenarios) and evaluates the portfolio under each one, producing a distribution of outcomes rather than a single point estimate.

### Mortality Rate

The probability that a policyholder dies within a given time period (typically one month or one year), expressed as a function of age and gender. In the projection engine, mortality rates are derived from the Gompertz-Makeham model and serve as hazard rates driving transitions from the Active state to the Death Benefit state in the Markov Graph.

## N

### NINS (Non-Life Insurance)

A proposed ACTUS-I contract type for non-life (property and casualty) insurance.

### Notional Principal

The face value of a financial contract on which interest calculations are based. For a loan of 1,000,000 at 5% annual interest, the notional principal is 1,000,000.

### ns/c/s (Nanoseconds per Contract per Scenario)

A normalised benchmark metric defined as total elapsed time (in nanoseconds) divided by the product of the number of contracts and the number of scenarios: `ns/c/s = elapsed_ns / (contracts × scenarios)`. This metric removes the confounding effect of portfolio size, enabling fair comparison of computational efficiency across batch sizes. A lower ns/c/s value indicates better efficiency. Used throughout the benchmark analysis to compare CPU and GPU execution paths.

## O

### OpenCL

**Open Computing Language.** An open standard for cross-platform parallel computing on CPUs, GPUs, and other processors. OpenCL provides broader hardware compatibility than CUDA but typically achieves lower performance on NVIDIA GPUs.

## P

### PAM (Principal at Maturity)

The most fundamental ACTUS contract type. A PAM contract involves the exchange of a principal at the start (IED), periodic interest payments (IP), and the return of the principal at maturity (MD). Examples include fixed-term deposits, bullet loans, and zero-coupon bonds.

### Payoff

The cash flow amount produced by a single contract event. Each event type has a specific formula for computing its payoff based on the current contract state and terms.

### PayoffCube

A multi-dimensional flat array used to store Monte Carlo valuation results, indexed by [Kind × Contract × Scenario × TimeStep]. The GPU kernel accumulates payoffs into this cube using atomic operations, enabling efficient per-contract, per-scenario aggregation.

### PCIe (Peripheral Component Interconnect Express)

The high-speed hardware bus that connects a GPU to the CPU and system memory. All data transferred between CPU memory and GPU memory — both H2D (Host-to-Device) and D2H (Device-to-Host) — travels over the PCIe bus. PCIe bandwidth is a key bottleneck in GPU-accelerated pipelines, which motivates the sink architecture: aggregating results on the device before transfer minimises the volume of data crossing the PCIe bus.

### Portfolio Runner

A high-level component that orchestrates the evaluation of many financial contracts as a batch. The portfolio runner manages data preparation, execution (CPU or GPU), and result collection.

### Present Value (PV)

The current worth of a future cash flow, obtained by multiplying the cash flow by its discount factor. PV = CashFlow * DF(t). The total present value of a contract is the sum of the present values of all its future cash flows.

## R

### Risk Factor

An external variable (such as an interest rate or exchange rate) that influences the cash flows of financial contracts. In ACTUS, risk factors are provided via a Risk Factor Model that supplies observed or simulated values at specific points in time.

### Risk Factor Model

A data structure that stores market data (interest rates, indices, FX rates) indexed by identifier and time. When a contract event needs a market rate (e.g., a rate reset), it queries the Risk Factor Model.

### Role Sign

A value of +1 or -1 determined by the contract role. It controls the direction of cash flows. For RPA (receive principal), RoleSign = +1; for RPL (pay principal), RoleSign = -1.

### Rule Pack

A package of DSL rules that define the behaviour of an insurance product. A rule pack includes product metadata, calculation rules (premiums, benefits, loadings), lookup table definitions, and the Markov graph definition. New products can be added by creating new rule packs without modifying the engine.

## S

### Scenario

A single simulated path of future market variables (e.g., interest rates) over a defined time horizon. In Monte Carlo simulation, many scenarios are generated to capture the range of possible outcomes.

### SIMT (Single Instruction Multiple Threads)

The execution model used by GPUs, in which a single instruction is broadcast to and executed simultaneously by many threads, each operating on a different data element. SIMT is the hardware basis for GPU parallelism: thousands of threads run the same kernel code but each processes a different contract or contract-scenario pair. Workloads where all threads follow identical code paths (minimal conditional branching) make the most efficient use of SIMT execution. Life insurance Markov projections benefit especially from SIMT because every policy step applies the same arithmetic to different actuarial table values.

### SoA (Structure of Arrays)

A data layout where each field of a data type is stored in its own contiguous array. For example, instead of storing [Contract1{principal, rate}, Contract2{principal, rate}], SoA stores [principal1, principal2] and [rate1, rate2] separately. This layout enables efficient GPU memory access (coalesced reads) and SIMD processing. Compare with AoS.

### Solvency II

The European Union regulatory framework for insurance companies, requiring risk-based capital calculations and forward-looking risk assessments.

### State Machine

A computational model where a system exists in one of a finite number of states and transitions between states based on events and conditions. In ACTUS, each contract is modeled as a state machine: events trigger state transitions and produce cash flows according to deterministic rules.

### State Space

The collection of all state variables that define a contract's condition at a point in time. For PAM contracts, the state space includes: Notional Principal, Nominal Interest Rate, Accrued Interest, Fee Accrued, Notional Scaling Multiplier, Interest Scaling Multiplier, Status Date, and Contract Performance.

## V

### VaR (Value at Risk)

A risk metric that estimates the loss threshold at a given confidence level over a defined time horizon. VaR99 represents the 99th percentile of the loss distribution — losses will not exceed this level in 99% of scenarios, and will exceed it in only 1% of scenarios. VaR identifies the boundary of the loss tail but does not measure the severity of losses beyond it; that is the role of Expected Shortfall (ES).

### Vasicek Model

A mathematical model for simulating interest rate paths. The Vasicek model is mean-reverting: rates tend to drift toward a long-term average. The formula is: dr = kappa * (theta - r) * dt + sigma * sqrt(dt) * Z, where kappa is the speed of mean reversion, theta is the long-term mean rate, sigma is the volatility, and Z is a standard normal random variable.

## X

### XorShift64

A fast pseudorandom number generator (PRNG) algorithm. XorShift64 uses bitwise XOR and shift operations to produce random numbers with good statistical properties and minimal computational overhead. In this project, XorShift64 is seeded deterministically to ensure reproducible results.

## Y

### Year Fraction

The proportion of a year between two dates, as calculated by a specific day count convention. Year fractions are used in interest calculations: Interest = Principal * Rate * YearFraction.
