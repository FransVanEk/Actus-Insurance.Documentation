---
title: Contract Types in the Specification
description: The financial contract types formally specified in the ACTUS Technical Specification — grouped by category with brief descriptions.
category: ACTUS Organization — Technical Specifications
order: 5
source: https://github.com/actusfrf/actus-techspecs
---

# Contract Types in the Specification

## Overview

The ACTUS Technical Specification formally defines each contract type as a state machine: it specifies the schedule generation algorithm, the state initialization logic, and the STF/POF pair for every event type applicable to that contract.

ACTUS represents virtually all financial instruments by parameterizing and combining a set of contract types, each capturing a distinct cash flow pattern. The specification covers approximately 32 contract types across several categories.

## Fixed Income — With Maturities

These contract types model instruments that have a defined end date (maturity).

| Code | Name | Cash Flow Pattern |
|------|------|-------------------|
| PAM | Principal at Maturity | Periodic interest payments; full principal repaid at maturity |
| ANN | Annuity | Level periodic payments covering both interest and principal |
| NAM | Negative Amortizer | Payments may be less than accrued interest; shortfall capitalizes |
| LAM | Linear Amortizer | Fixed periodic principal redemptions with declining interest |
| ANX | Exotic Annuity | Annuity variant with additional structural features |
| NAX | Exotic Negative Amortizer | Negative amortizer variant with additional structural features |
| LAX | Exotic Linear Amortizer | Linear amortizer variant with additional structural features |
| CLM | Call Money | Short-term credit facility callable by either party |
| PBN | Perpetual Bond | Coupon-only; no maturity; principal not redeemed |

## Fixed Income — Without Maturities

These contract types model open-ended or demand instruments.

| Code | Name | Description |
|------|------|-------------|
| CSH | Cash | Current account or cash holding |
| UMP | Undefined Maturity Profile | Instrument with no fixed maturity and market-risk-driven balance |

## Index-Based

| Code | Name | Description |
|------|------|-------------|
| STK | Stock | Equity instrument with dividend payments |
| COM | Commodity | Physical or financial commodity instrument |

## Combined Symmetric (Derivatives)

Symmetric instruments where both counterparties have obligations.

| Code | Name | Description |
|------|------|-------------|
| SWAPS | Swap | Exchange of cash flows between two legs |
| SWPPV | Plain Vanilla Swap | Fixed-for-floating interest rate swap |
| FXOUT | Foreign Exchange Outright | Spot or forward exchange of two currencies |
| FUTUR | Future | Exchange-traded futures contract |

## Combined Asymmetric (Options)

Asymmetric instruments where one party has the right but not the obligation.

| Code | Name | Description |
|------|------|-------------|
| OPTNS | Option | Right to buy or sell an underlying at a given price |
| CAPFL | Cap/Floor | Interest rate cap or floor |
| BNDCP | Bond with Call/Put | Bond with embedded call or put option |
| BNDWR | Bond with Warrant | Bond with attached warrant |
| EXOTI | Exotic Option | Non-standard option payoff structure |

## Securitization

| Code | Name | Description |
|------|------|-------------|
| CDSWP | Credit Default Swap | Protection on a reference credit |
| TRSWP | Total Return Swap | Exchange of total return of an asset for a fixed or floating rate |
| CLNTE | Credit Linked Note | Debt instrument with embedded credit derivative |
| SCRMR | Securitization — Mortgage | Mortgage-backed securitization structure |
| SCRCR | Securitization — Corporate | Corporate-backed securitization structure |

## Credit Enhancement

| Code | Name | Description |
|------|------|-------------|
| CEG | Guarantee | Creates a relationship between a guarantor, an obligee, and a debtor, moving the exposure from the debtor to the guarantor |
| CEC | Collateral | Creates a relationship between a collateral, an obligee, and a debtor, covering the exposure from the debtor with the collateral |
| BCS | Basic Credit Sheet | Simplified credit support instrument |

## What the Specification Defines Per Contract Type

For every contract type, the ACTUS Technical Specification provides:

1. **Applicable contract terms** — the subset of data dictionary attributes that are mandatory, optional, or non-applicable for this contract type, following the attribute applicability rules

2. **Schedule generation algorithm** — a step-by-step description of how to generate the event schedule from the contract terms, including which cycles generate which event types

3. **State initialization** — the initial values of all state variables, derived from the contract terms at the status date

4. **State Transition Functions** — one STF per applicable event type, defining how the state variables change when that event is processed

5. **Payoff Functions** — one POF per applicable event type, defining how the cash flow is computed from the state variables and contract terms

The specification is written for all contract types in a consistent format, enabling engine implementations to follow a uniform processing model regardless of contract type.
