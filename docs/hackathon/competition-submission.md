---
title: Competition Submission — ACTUS-I
description: Submission responses for the ACTUS competition proposal "Extending Algorithmic Financial Contracts into Insurance with High-Performance Portfolio Projections."
category: Hackathon
order: 4
---

# Competition Submission

**Selected Proposal:** ACTUS-I — Extending Algorithmic Financial Contracts into Insurance with High-Performance Portfolio Projections

---
**Project Solution Description (≤2000 characters)**

The project introduces **ACTUS-I**, an extension of the ACTUS Algorithmic Financial Contract Standard that enables insurance contracts to be represented and projected using the same deterministic, machine-readable framework already used for banking products. The solution demonstrates that banking and insurance contracts can be modeled, simulated, and analyzed within a **single unified projection engine**, enabling transparent and scalable financial risk analysis. 

ACTUS-I defines insurance-specific contract structures while preserving the core ACTUS lifecycle model. It introduces insurance attributes such as premiums, coverage limits, deductibles, and reinsurance terms, together with state variables for claims, benefits, reserves, and policy status. Contract lifecycles are represented through events such as premium payments, claim triggers, benefit payouts, and policy state transitions, allowing insurance cash flows to be computed deterministically from contract definitions. 

To model the probabilistic nature of insurance outcomes, the system incorporates a **Markov state-machine representation of policy lifecycles**. At each time step, the model propagates probabilities across states (for example active, lapsed, claim open, or benefit paid) using actuarial hazard tables for mortality, lapse, and disability. This produces probability-weighted expected cash flows while preserving the reproducibility required by the ACTUS standard. 

The contracts are executed in a **high-performance projection engine** capable of processing large portfolios of mixed banking and insurance contracts. The engine supports both deterministic projections and Monte Carlo scenario simulations, enabling forward-looking portfolio analysis, tail-risk measurement, and economic capital estimation. To ensure consistency between portfolio projections and individual contract calculations, the same computational kernel can run on both CPU and GPU architectures. 

By combining a standardized contract representation with scalable projection technology, the solution enables institutions to perform fast, transparent, and reproducible portfolio analysis across both assets and liabilities. The result is a unified analytical framework that supports risk management, regulatory reporting, and forward-looking financial decision-making at scale. 

---

## URL to Demonstration Video

[Video of the presentationapplication demo](https://actus-insurance-documentation.vercel.app/downloads/demo-video.mp4)

---

## URL to Solution

[Demo site with information and resources](https://actus-insurance-documentation.vercel.app/)

---

## Core Team Members

**Frans Van Ek** — Led the core setup, programmed the GPU kernels, converted the site documentation into the new layout, and developed the PAM and insurance contract extensions. 

**Cristina Mudura** - Contributed on the deployment, creation of the base documentation site, and validation of the implementations.

---

## Key Innovations and Unique Value Proposition

A major innovation lies in the execution architecture of the projection engine. Large-scale portfolio valuation requires enormous computational throughput: projecting millions of policies across hundreds of time steps with stochastic decrements is inherently parallel and naturally suited for GPU acceleration. However, GPU-only implementations introduce a serious practical problem: calculation drift.

In most actuarial systems, individual contract calculations (for example policy servicing, illustration, or audit checks) are executed on the CPU, while portfolio projections run on specialized GPU code. Even when both implementations aim to follow the same formulas, small differences in code paths, floating-point behavior, or update order inevitably appear over time. This creates reconciliation problems: the projection engine may produce results that cannot be reproduced by the single-policy calculation engine.

The innovation in this project is that the exact same computational kernel is used for both CPU and GPU execution.

The other innovation is the **principled extension of the ACTUS standard into the insurance domain** — something that has not previously existed in a production-grade open implementation.

ACTUS was designed for banking contracts, where every cash flow follows a deterministic schedule. Insurance contracts are fundamentally different: whether a policy pays a death benefit, lapses, or matures depends on probabilities, not on a fixed date. Bridging these two paradigms required solving several distinct problems simultaneously.

**1. A Markov state machine for insurance contracts**

The project introduces a 10-state Markov model as the formal representation of insurance policy lifecycle. Rather than projecting a single fixed path, the model carries forward a probability distribution across all possible states at every monthly time step — Active, Lapsed, Grace Period, Claim Open, Death Claim Paid, and others. At each step the model applies competing-risk decrements from actuarial hazard tables (mortality via Gompertz-Makeham, lapse by duration, disability by age) and produces a probability-weighted expected cash flow. This is mathematically rigorous, reproducible, and fully compatible with the ACTUS design principle of determinism: given the same actuarial assumptions, the same expected cash flows are always produced.

**2. A domain-specific language for insurance product rules**

Actuarial tables alone cannot capture the full variation between insurance products. Grace period lengths, paid-up conversion formulas, reinstatement eligibility windows, and underwriting loadings are product-specific and cannot be expressed in a simple lookup table. The project includes a complete DSL — lexer, recursive-descent parser, evaluator — that allows product rules to be defined in structured text without modifying the engine. New products are added by writing a new rule pack; the projection infrastructure is unchanged. This separates product design from engineering and allows actuaries to work independently of the development team.

**3. Monte Carlo simulation on a parallel architecture**

A single best-estimate projection is insufficient for risk management. The project supports full stochastic Monte Carlo simulation: thousands of scenarios are constructed by perturbing actuarial assumptions (mortality shocks, lapse shocks, disability shocks), each scenario runs the complete Markov projection independently, and the collection of results builds a probability distribution over portfolio outcomes. This makes the 95th percentile loss, tail risk quantification, and economic capital calculation directly computable — not approximated.

**4. A unified architecture across banking and insurance**

Both banking contracts (via the existing ACTUS standard) and insurance contracts share the same underlying projection infrastructure. A portfolio containing both fixed-rate bonds and life insurance policies can be evaluated in a single run, producing a consolidated cash flow view across the entire balance sheet. This is valuable for insurers that also hold investment portfolios and for banks that offer insurance products — the boundary between the two domains has historically been a reporting and systems barrier. This project removes it.

**5. Configurability through the Markov graph definition**

The state diagram itself is an externally defined resource, not hard-coded. By changing the graph definition, different product structures — term life, whole life, critical illness, disability income — can be modelled without any engine changes. This makes the architecture product-agnostic and future-proof.

---

## Possible Next Steps and Subsequent Developments

The work completed in the competition establishes a foundation that can be extended in several important directions.

**Broader contract type coverage.** The current implementation covers life insurance with mortality, lapse, and disability hazards. Natural extensions include critical illness contracts (with specific illness-event triggers), disability income (with recovery transitions from claim back to active), and group insurance (where the unit of projection is a cohort rather than an individual policy).

**Regulatory integration.** Insurance regulation increasingly requires stochastic solvency projections — Solvency II in Europe and analogous frameworks elsewhere mandate that insurers demonstrate solvency under a range of adverse scenarios. The Monte Carlo engine built in this project is directly applicable to producing the scenario outputs required for regulatory capital calculations. Standardising the scenario definitions and output format to match regulatory specifications would make the tool immediately usable in compliance workflows.

**Reinsurance modelling.** The current model projects direct insurance policies. Reinsurance arrangements — quota share, excess of loss, stop loss — modify the cash flow profile at portfolio level. Layering reinsurance structures on top of the gross projection would allow insurers to evaluate the net impact of their reinsurance programme under different scenarios.

**Integration with ACTUS financial contract data.** Insurers hold investment portfolios alongside their insurance liabilities. Connecting the insurance projection output to the existing ACTUS financial contract engine would allow asset-liability management analysis: projecting both sides of the balance sheet under the same scenario assumptions and measuring the mismatch.

**Actuarial table marketplace.** The current implementation uses built-in parametric models. A natural evolution is a pluggable table registry where insurers can supply their own experience-based mortality and lapse tables, or access standardised population tables by jurisdiction. This would let the tool be deployed across different markets without rebuilding the actuarial inputs.

**User interface for actuaries.** The current work is an engine and a data standard extension. A practical next step is a workbench interface — web or desktop — that allows actuaries to define products, load portfolios, configure scenarios, and visualise results without writing code. The DSL and rule pack structure is already designed to support this.

---

## Challenges in Realising the Solution

**Conceptual challenge — bridging deterministic and probabilistic contract paradigms.**
ACTUS is designed for deterministic financial contracts with predefined event schedules. Insurance contracts behave differently: policy outcomes depend on probabilistic events such as death, lapse, or disability. The challenge was to extend the ACTUS framework without losing its key property of reproducibility. This required introducing a Markov state-machine representation of the insurance lifecycle while ensuring that the final projected cash flows remain deterministic expected values.

**Technical challenge — high‑performance computation with consistent results.**
The engine needed to support large-scale GPU parallelism while maintaining exact agreement with CPU calculations. Financial contracts also contain heterogeneous data structures (dates, text labels, variable-length events) that GPUs cannot process directly. In addition, floating‑point rounding differences between execution environments created small numerical discrepancies during validation.

**Data challenge — reliable and consistent inputs.**
Financial models are highly sensitive to input interpretation. Even minor differences in numeric formatting or configuration could lead to large calculation errors. Ensuring that interest rates, actuarial tables, and reference datasets were interpreted consistently across environments required strict standardisation of numeric parsing and data handling.

**Scope challenge — balancing performance goals with practical constraints.**
GPU acceleration offers significant performance gains for large portfolios but introduces setup overhead. For small workloads this overhead can outweigh the performance benefits, making CPU execution faster.

---

## How Challenges Were Overcome

**On the paradigm bridge:**
Insurance contracts were represented as a Markov state machine driven by actuarial hazard tables. Instead of simulating individual stochastic paths, the engine propagates state probabilities and computes expected cash flows. This preserves the deterministic ACTUS guarantee: identical inputs always produce identical outputs.

**On the technical challenges:**
A dedicated transformation layer converts contracts into compact numeric structures suitable for parallel execution. Sensitive calculations such as discount factors are computed once and reused to avoid numerical drift, and explicit event priority rules ensure deterministic processing when multiple events occur on the same date.

**On the data challenge:**
All numeric inputs are parsed using a fixed, locale‑independent convention. Reference tests were executed across different system configurations to confirm consistent results.

**On scope and performance:**
The system supports both CPU and GPU execution. Smaller workloads run efficiently on the CPU, while large portfolios benefit from GPU parallelism, allowing the platform to scale without sacrificing practicality.


## Results and Success Rating

The project delivered a working prototype that demonstrates the feasibility of **ACTUS-I — extending the ACTUS algorithmic financial contract framework into the insurance domain while maintaining the standard’s deterministic and reproducible design principles**.

The implementation includes the core architectural elements required to validate the vision of a unified contract projection framework:

* **Markov state-machine model** representing the lifecycle of insurance contracts.
* Integration of **actuarial hazard tables** and probability-based state transitions.
* **domain-specific language (DSL)** enabling product rules to be defined independently of the projection engine.
* **Monte Carlo scenario simulation** integrated with the ACTUS execution infrastructure.
* **GPU-enabled projection engine** capable of processing portfolio-scale calculations while preserving deterministic results consistent with CPU execution.


Most importantly, the system demonstrates that **banking contracts and insurance contracts can be processed within the same ACTUS-based projection engine**, supporting the broader vision of a unified algorithmic financial contract standard capable of large-scale forward-looking portfolio analysis.

The project also produced a structured **documentation and demonstration website** that explains the architecture, implementation decisions, and results. This website serves as the primary evidence artifact for the project and documents the complete design and working prototype.

The insurance extension has been **implemented and validated using a full working product example**, proving the technical feasibility of the ACTUS-I contract model. While only one product type was implemented within the available timeframe, the DSL-based architecture allows additional products to be added without changes to the projection engine.

The reporting and monitoring infrastructure described in the vision has been **partially implemented**. Initial reporting pipelines and demonstration outputs exist, but the full automated reporting, alerting, and early-warning framework remains future work.

The primary objective — **demonstrating that ACTUS can be extended into the insurance domain while remaining standards-compatible, reproducible, and computationally scalable** — was successfully achieved. The working prototype executes insurance projections within the ACTUS engine and demonstrates GPU-accelerated portfolio calculations.

**Self-assessed success rating: 4 / 5**

All core architectural objectives were achieved: the ACTUS-I insurance extension, unified projection engine, GPU-enabled portfolio processing, and demonstration of insurance contract projections. Remaining stretch goals mainly concern completing the automated reporting and early-warning capabilities envisioned for the platform.



## Additional Materials

### Repositories

- **[Actus-Insurance.Documentation](https://github.com/FransVanEk/Actus-Insurance.Documentation)** — Public

  - The documentation you are reading now. Contains all conceptual and technical documentation for the insurance extension: the Markov model, DSL and product rules, Monte Carlo simulation, and the life insurance projection model.

- **[Actus-Insurance.Core](https://github.com/FransVanEk/Actus-Insurance.Core)** — Public

  - The C# implementation of the insurance contract extensions. Contains the Markov state machine, the DSL interpreter, actuarial lookup tables, the rule pack loader, and the insurance contract adapter that connects to the ACTUS contract engine.

- **[Actus-Insurance.GPU](https://github.com/FransVanEk/Actus-Insurance.GPU)** — Private

  - The high-performance GPU kernel that runs the portfolio projection. This repository is proprietary and not publicly available. It publishes compiled packages to GitHub Packages, which the other repositories consume as dependencies.

- **[Actus-Insurance.DemoAndSamples](https://github.com/FransVanEk/Actus-Insurance.DemoAndSamples)** — Public

  - End-to-end examples showing how to use the insurance extension in your own solution. This is the recommended starting point for implementers. It consumes the published GPU packages as a dependency and demonstrates how the Core, GPU, and Documentation components work together in practice.

Suggested materials to include if available:

- **Technical architecture document** — overview of the system design, component responsibilities, and data flows
- **Actuarial validation report** — comparison of model output against known actuarial benchmarks or independently computed reference values
- **Test portfolio results** — sample output showing projected cash flows, state probability distributions, and Monte Carlo percentile bands for a representative policy or portfolio
- **DSL rule pack examples** — sample product definitions illustrating how term life and whole life products are expressed in the rule language
- **Slides or poster** — visual summary of the innovation and results suitable for a pitch or poster session

[TODO: insert links or upload references for any of the above that exist]

---

## Value and Benefits Realised

The participation in the competition crystallised something that the ACTUS community has discussed but not yet implemented: a unified standard that covers both financial and insurance contracts within the same formal framework.

The value demonstrated is concrete and at multiple levels.

**For the ACTUS standard itself**, the work shows that the core design principles — determinism, reproducibility, separation of data standard from algorithmic standard — extend naturally to the insurance domain. The extension did not require abandoning or compromising those principles. It validated that the framework is genuinely general.

**For insurers**, the combination of a formal contract standard, a configurable product rule language, and a high-performance stochastic projection engine addresses a real and expensive problem: most insurers today run their liability projections on systems that are slow, inflexible, and proprietary. A standards-based open approach reduces vendor lock-in, improves auditability (the rules are readable, not buried in compiled code), and makes it practical to run the thousands of scenarios that modern risk management and regulation require.

**For regulators and supervisors**, a standardised machine-readable representation of insurance contracts offers the same benefits it provides in banking: the ability to collect and compare contract data across institutions in a common format, and to apply scenario analysis systematically rather than institution by institution.

**For the broader fintech and insurtech ecosystem**, demonstrating a working open implementation lowers the barrier for other developers to build on the standard — whether as analytics tools, pricing engines, ALM systems, or regulatory reporting solutions. There is access needed to be able to run this repo. it is merely for showcasing the code.

---

## Available to Pitch Virtually?

- [X] Yes
- [ ] No
