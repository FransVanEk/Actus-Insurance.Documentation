---
title: Competition Submission — ACTUS-I
description: Submission responses for the ACTUS competition proposal "Extending Algorithmic Financial Contracts into Insurance with High-Performance Portfolio Projections."
category: ACTUS Organization
order: 20
---

# Competition Submission

**Selected Proposal:** ACTUS-I — Extending Algorithmic Financial Contracts into Insurance with High-Performance Portfolio Projections

---

## URL to Demonstration Video

[TODO: insert link to demonstration video]

---

## URL to Solution

[TODO: insert link to live demo, GitHub repository, or hosted application — e.g., https://github.com/[org]/actus-final]

---

## Core Team Members

[TODO: Add each team member with the following pattern]

**[Name]** — [Role on project]
[2–3 sentences on background and specific contributions: e.g., designed the Markov model, implemented the GPU kernel, built the DSL interpreter, developed the insurance contract adapter, etc.]

---

## Key Innovations and Unique Value Proposition

The central innovation is the **principled extension of the ACTUS standard into the insurance domain** — something that has not previously existed in a production-grade open implementation.

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

[TODO: describe the specific challenges encountered — the answers below are structured prompts; fill in with your team's actual experience]

**Conceptual challenge — bridging deterministic and probabilistic contract paradigms.** The ACTUS standard is built around deterministic event schedules. Extending it to insurance required developing a new formal representation — the Markov state machine — that preserves the standard's reproducibility guarantee while accommodating probabilistic state transitions. Defining the interface between the deterministic scheduling logic and the probabilistic projection loop required careful architectural work.

**Technical challenge — [TODO: e.g., GPU parallelism, DSL implementation, numerical precision in competing-risk calculations, handling edge cases in the Markov graph, large-scale test coverage]**

**Data challenge — [TODO: e.g., sourcing or constructing actuarial tables, designing realistic test portfolios, validating outputs against known actuarial benchmarks]**

**Scope challenge — [TODO: describe any tension between ambition and the competition timeline — what had to be deferred, what trade-offs were made]**

---

## How Challenges Were Overcome

[TODO: for each challenge listed above, describe the specific approach taken]

**On the paradigm bridge:** [TODO — e.g., the solution was to treat the Markov model as a source of transition probabilities that feed a hazard matrix, which is conceptually analogous to the risk factor model in ACTUS banking contracts. This reframing allowed the existing infrastructure to be reused with minimal modification.]

**On [technical challenge]:** [TODO]

**On [data challenge]:** [TODO]

**On scope:** [TODO — e.g., the DSL was implemented with a deliberately minimal feature set for the competition, sufficient to demonstrate configurability, with more advanced features deferred to post-competition development.]

---

## Results and Success Rating

[TODO: describe outcomes — what was built, what was demonstrated, what works end to end]

The project delivered a working implementation of the ACTUS insurance extension across all core components: the Markov state model, actuarial hazard tables, the DSL interpreter, Monte Carlo scenario simulation, and integration with the existing ACTUS banking contract infrastructure.

[TODO: add any quantitative results — e.g., projection throughput numbers, portfolio sizes tested, number of scenarios demonstrated, test coverage statistics]

**Self-assessed success rating:** [TODO: e.g., 4/5 — all core objectives met; the following stretch goals were not fully completed: ...]

The primary objective — demonstrating that the ACTUS framework can be extended to cover insurance contracts in a standards-compatible, reproducible, and computationally efficient way — was [TODO: achieved / substantially achieved / partially achieved], as evidenced by [TODO: specific demonstration or test result].

---

## Additional Materials

[TODO: list any supplementary materials not covered by the video and solution URL]

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

**For the broader fintech and insurtech ecosystem**, demonstrating a working open implementation lowers the barrier for other developers to build on the standard — whether as analytics tools, pricing engines, ALM systems, or regulatory reporting solutions.

---

## Available to Pitch Virtually?

[TODO: select one]

- [ ] Yes
- [ ] No
