---
title: State Transition Functions and Payoff Functions
description: The two core function families in the ACTUS specification — STF and POF — how they are named, what they define, and how they relate to each other.
category: ACTUS Organization — Technical Specifications
order: 3
source: https://github.com/actusfrf/actus-techspecs
---

# State Transition Functions and Payoff Functions

## Two Function Families

The ACTUS Technical Specification defines two families of functions for each contract type:

- **State Transition Functions (STF)** — update the contract state when an event occurs
- **Payoff Functions (POF)** — compute the cash flow produced by an event

Together, STF and POF fully define the behavior of a contract type at every event.

## State Transition Functions (STF)

State Transition Functions define the transition of states from a pre-event to a post-event state when a certain event applies. The pre-event and post-event times are indexed with **t⁻** and **t⁺**, respectively.

An STF takes as input the contract state at t⁻ (immediately before the event), the contract terms, and any applicable risk factor values at the event time. It produces as output the updated contract state at t⁺ (immediately after the event).

STFs are named according to the pattern: `STF_[EventType]_[ContractType]`

where `[EventType]` refers to the event type code and `[ContractType]` refers to the contract type code to which the STF applies.

## Payoff Functions (POF)

Payoff Functions define how the cash flow for a certain event is derived from the current states and from the contract terms. If necessary, the resulting cash flow can be indexed with the event time.

POFs are named according to the pattern: `POF_[EventType]_[ContractType]`

A POF takes as input the contract state at t⁻ and the contract terms. It returns the cash flow amount — positive if it represents money received by the long party, negative if money is paid.

## Event Types

Contract events mark specific points in time during the lifetime of a contract at which a cash flow is being exchanged or the states of the contract are being updated. The specification defines a set of event types, each with a corresponding STF and POF per contract type.

Event types defined in the ACTUS specification include:

| Code | Event Type |
|------|------------|
| AD | Monitoring / Analysis Date |
| IED | Initial Exchange Date |
| FP | Fee Payment |
| PR | Principal Redemption |
| PI | Principal Increase |
| PRF | Principal Payment Cash Flow |
| IP | Interest Payment |
| IPCI | Interest Capitalization |
| IPCB | Interest Calculation Base Fixing |
| RR | Rate Reset (fixing) |
| RRF | Rate Reset (floating) |
| SC | Scaling Index Fixing |
| PRD | Purchase Date |
| TD | Termination Date |
| MD | Maturity Date |
| PP | Penalty Payment |
| STD | Settlement Date |
| XD | Execution Date |
| DV | Dividend Payment |
| MR | Margin Call |
| CD | Credit Default |

## Event Sequence

When events of different types occur at the same time, the specification assigns each event type an event sequence indicator (priority). This indicator defines the order in which events at the same timestamp are evaluated, which is decisive for the resulting cash flows and state transitions.

## Function Naming Convention

The specification uses a consistent naming pattern so that every function is unambiguously identified. For example:

- `STF_IP_PAM` — the State Transition Function for an Interest Payment event on a PAM (Principal at Maturity) contract
- `POF_IP_PAM` — the Payoff Function for an Interest Payment event on a PAM contract
- `STF_RR_ANN` — the State Transition Function for a Rate Reset event on an ANN (Annuity) contract

This pattern scales across all event types and contract types. Where an event type does not apply to a contract type, the STF and POF are defined as no-op (identity) functions.

## Relationship to Risk Factors

At certain events — notably Rate Reset (RR, RRF) and Scaling (SC) — the STF requires a current value from an external risk factor (such as an interest rate index or a scaling index). The specification defines the interface through which risk factor values are accessed, but the actual values come from an external risk factor database at evaluation time.
