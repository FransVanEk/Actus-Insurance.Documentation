---
title: Fundamentals
description: The ACTUS modeling paradigm — contract types as building blocks, separation of knowns and unknowns, the two standards, and the state machine model.
category: ACTUS Organization
order: 3
source: https://www.actusfrf.org/methodology
---

# Fundamentals

## The Modeling Paradigm

ACTUS is based on a modeling paradigm in which standardized Contract Types (CTs) are the granular building blocks of the financial world. ACTUS aims to raise this standardization to a universal and global level with a smart and machine-readable algorithmic representation of all legal agreements and a strict separation of the known from the unknown.

## Known and Unknown

The only knowns are the legal agreements and possibly the current state of the risk factors. The unknowns are the future states of the risk factors — in particular, the market, counterparty, and behavioral risks.

Given the state of contracts and a scenario of risk factors, it is possible to derive the contract events, which generate the expected state-contingent cash flows. From expected state-contingent cash flows it is possible to derive the analytical metrics of interest, such as income, value, and liquidity.

## The Two Standards

### The Data Standard

The Data Standard defines a universal set of legal terms — or CT Attributes — used as parameters throughout the different financial agreements. It is implemented in the form of a [Data Dictionary](./data-dictionary.md) with attribute applicability by contract type.

### The Algorithmic Standard

The Algorithmic Standard defines the logic embedded in legal agreements that eventually turns the contract terms into actual cash flows, or more generally business events. The formal specification of this standard is documented in the [Technical Specification](./technical-specification.md).

## The State Machine Model

The financial contract is modeled as a persistable state machine which follows a possibly dynamic event schedule and keeps track of the current state and ownership. The formal four-component definition of this model — states, events, transitions, and payoffs — is given in the [Technical Specification Framework](./techspecs/framework.md).

## Risk Factors

Financial contracts and current states of the risk factors — yield curves, FX rates, and similar market data — are the core inputs. Given the state of contracts and a scenario of risk factors, it is possible to derive the contract events which generate expected state-contingent cash flows.

## Applications

The two standards together support forward-looking financial and risk analysis. ACTUS can form the computation core of smart financial contracts, as well as a broad range of financial activities, including:

- Transaction processing
- Risk management
- Liquidity analysis
- Pre-trade analysis
- Forward business planning
- Building accounts
