---
title: Formal Framework
description: The ACTUS state machine model as defined in the Technical Specification — the four components, inputs, outputs, contract state, event sequencing, and per-contract-type definition structure.
category: ACTUS Organization — Technical Specifications
order: 2
source: https://github.com/actusfrf/actus-techspecs
---

# Formal Framework

The ACTUS Technical Specification formally defines each financial contract as a persistable state machine. This page covers the four-component model, the two input types, the output structure, and what the specification defines per contract type. For the motivation behind separating knowns from unknowns, see [Fundamentals](../fundamentals.md).

## State Machine Abstraction

Each financial contract in ACTUS is defined as a state machine with four components:

- **States (S)** — the contract state vector, holding the current values of all state variables
- **Events (E)** — discrete points in time at which cash flows are exchanged or states are updated
- **Transitions (T)** — the state transition functions that map a pre-event state to a post-event state
- **Payoffs (P)** — the payoff functions that compute the cash flow at each event

When a contract is evaluated at an event `e`, a counterparty receives a payout `P(e)`, which can be positive or negative.

## Inputs

An ACTUS Contract Type requires two types of input:

**Contract Terms** — the legal parameters defining the contract, drawn from the [ACTUS Data Dictionary](../data-dictionary.md). Contract terms include elements such as the notional principal, interest rate, maturity date, and applicable cycles and conventions.

**Risk Factor States** — the current and future states of market, counterparty, and behavioral risk factors such as interest rates, exchange rates, and credit indicators. Risk factors are held in databases outside the contract definition itself.

## Outputs

The output of an ACTUS Contract Type is a set of **Contract Events (CE)**. Contract Events denote real-world transaction events such as the initiation of a contract deal, the maturity of a contract, or interest and dividend payments. Each contract event has a time, an event type, a payoff amount, and a resulting state.

## Contract State

The contract state is a vector of state variables that changes as each event is processed. State variables track quantities such as the current notional principal, accrued interest, the nominal interest rate, the performance status of the contract, and scaling multipliers.

Each event is processed at its scheduled time: the state transition function (STF) updates the state variables, and the payoff function (POF) computes the resulting cash flow. Both functions are defined in [STF and POF Functions](./functions.md).

## Event Sequencing

When contract events of different types occur at the same time, the sequence in which their STF and POF are evaluated is decisive for the resulting cash flows and state transitions. An event sequence indicator is used to define the processing order of events that occur at the exact same timestamp.

## Three-Part Contract Definition

For each contract type, the specification defines three things:

1. **Schedule generation** — the algorithm that produces the ordered list of contract events from the contract terms (see [Schedule Generation](./schedule.md))
2. **State initialization** — the initial values of all state variables, derived from the contract terms at the status date
3. **STF and POF functions** — one per applicable event type (see [STF and POF Functions](./functions.md))
