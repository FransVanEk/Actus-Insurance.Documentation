---
title: ACTUS Technical Specifications
description: Entry point for the actus-techspecs repository — what the document covers, how it is structured, and where to get it.
category: ACTUS Organization — Technical Specifications
order: 1
source: https://github.com/actusfrf/actus-techspecs
---

# ACTUS Technical Specifications

The ACTUS Technical Specification Document provides a formal specification of the ACTUS standard for the algorithmic representation of financial contracts. It is developed, maintained, and released by the ACTUS Users Association.

The source is a single LaTeX file (`actus-techspecs.tex`) in the GitHub repository `actusfrf/actus-techspecs`, Version 1.1 (June 8, 2020), licensed under Creative Commons Attribution Share-Alike (CC-BY-SA) 4.0. The compiled PDF is available at `https://www.actusfrf.org/algorithmic-standard`.

## Contents

- [Formal Framework](./framework.md) — the four-component state machine model, inputs, outputs, and per-contract-type definition structure
- [STF and POF Functions](./functions.md) — the two function families, event type codes, and naming conventions
- [Schedule Generation](./schedule.md) — cycle notation, date adjustment conventions, and event ordering
- [Contract Types](./contract-types.md) — all ~32 contract types and what the spec defines per type
- [Repository](./repository.md) — file listing, build instructions, license, contributing

## Relationship to the Data Standard

The Algorithmic Standard and the Data Standard ([Data Dictionary](../data-dictionary.md)) are two sides of a single standard. Contract terms from the data dictionary are the inputs to the algorithms defined here.
