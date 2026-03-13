---
title: Technical Specification
description: The ACTUS Algorithmic Standard — the formal specification that maps contract terms to contract events, maintained by the ACTUS Users Association.
category: ACTUS Organization
order: 7
source: https://www.actusfrf.org/techspecs
---

# Technical Specification

The Algorithmic Standard defines the logic embedded in legal agreements that eventually turns the contract terms into actual cash flows, or more generally business events. The Technical Specification is developed, maintained, and released by the ACTUS Users Association.

The specification is a single LaTeX source file (`actus-techspecs.tex`) in the GitHub repository `actusfrf/actus-techspecs`. The compiled PDF is available at `https://www.actusfrf.org/algorithmic-standard`. The document is licensed under Creative Commons Attribution Share-Alike (CC-BY-SA) version 4.0.

The ACTUS Users Association also releases a Java reference implementation through GitHub under the ACTUS Core License, consistent with this specification.

## Detailed Documentation

The full content of the `actusfrf/actus-techspecs` repository has been converted into the following documents:

- [Overview](./techspecs/index.md) — document purpose, version, license, and contents
- [Formal Framework](./techspecs/framework.md) — the state machine model: states, events, transitions, payoffs, inputs, outputs
- [STF and POF Functions](./techspecs/functions.md) — the two function families, event type table, naming conventions
- [Schedule Generation](./techspecs/schedule.md) — cycle notation, date adjustment, event ordering
- [Contract Types](./techspecs/contract-types.md) — all ~32 contract types and what the spec defines per type
- [Repository](./techspecs/repository.md) — file listing, build instructions, contributing
