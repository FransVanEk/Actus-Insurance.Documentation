---
title: Taxonomy
description: The ACTUS taxonomy of financial contract types — classification groups and every contract type with its description.
category: ACTUS Organization
order: 4
source: https://www.actusfrf.org/taxonomy
---

# Taxonomy

## Overview

The ACTUS taxonomy shows the classification of financial contracts as defined by ACTUS. Contract Types are defined based on the underlying contractual algorithm patterns that respectively cover different classes of financial products that each contract type pattern is able to express.

With very few exceptions, virtually all financial instruments currently known can be represented by parameterizing and combining a set of roughly 32 ACTUS financial contract types — ranging from very simple Principal at Maturity (PAM) or Annuity (ANN) bonds to Stocks (STK) or Commodity (COM) instruments to derivatives like futures (FUTUR) or options (OPTNS) and credit default swaps (CDSWP).

## Basic: Fixed Income — With Maturities

These contract types model instruments where principal and interest are exchanged according to a defined schedule.

| Code | Name | Description |
|---|---|---|
| PAM | Principal at Maturity | A bullet loan where principal is repaid in full at maturity. Periodic interest payments are made during the life of the contract. |
| ANN | Annuity | A loan amortized in the annuity method with a series of payments made between equal time intervals in equal amounts. The sum of interest and principal components is fixed, but the individual amounts change with each payment. |
| NAM | Negative Amortizer | Periodic payments of a fixed amount that may not cover the full interest due. Unpaid accrued interest is capitalized into the outstanding principal balance, causing the loan balance to increase over time. |
| LAM | Linear Amortizer | Periodic repayments of fixed principal amounts. The interest payment is recalculated with each repayment of principal, decreasing over time as the principal reduces. |
| ANX | Exotic Annuity | Step-up variation of the Annuity (ANN) contract type. |
| NAX | Exotic Negative Amortizer | Step-up variation of the Negative Amortizer (NAM) contract type. |
| LAX | Exotic Linear Amortizer | Step-up variation of the Linear Amortizer (LAM) contract type. |
| CLM | Call Money | An instrument where the client has the option to call the contract with a notice period after the current date. The contract will not be settled until the client exercises this option. |
| PBN | Perpetual Bond | A bond with no maturity date that pays periodic interest indefinitely. |

## Basic: Fixed Income — Without Maturities

| Code | Name | Description |
|---|---|---|
| CSH | Cash | Represents a cash position. |
| UMP | Undefined Maturity Profile | A contract type where the client has the option to call the contract with a notice period. Similar to CLM but with an undefined maturity profile. |

## Basic: Index-Based

| Code | Name | Description |
|---|---|---|
| STK | Stock | Represents equity holdings — shares of stock in a company. |
| COM | Commodity | Physical contracts holding a number of underlying units of a specific good, such as a number of barrels of oil. |

## Combined Contracts: Symmetric (Derivatives)

| Code | Name | Description |
|---|---|---|
| SWAPS | Plain Vanilla Interest Rate Swap | Exchange of fixed and floating interest rate payment streams between counterparties. |
| SWPPV | Plain Vanilla IR Swap PV | Present value variant of the plain vanilla interest rate swap. |
| FXOUT | Foreign Exchange Outright | An agreement to exchange one currency for another at a specified future date and a rate fixed at the time of agreement. |
| FUTUR | Future | A standardized contract to buy or sell an asset at a predetermined price at a specified future date. |

## Combined Contracts: Asymmetric (Options)

| Code | Name | Description |
|---|---|---|
| OPTNS | Option | The right, but not the obligation, to buy or sell an underlying asset at a predetermined price on or before a specified date. |
| CAPFL | Caplet / Floorlet | An interest rate cap or floor component that limits the maximum or minimum interest rate applicable in a period. |
| BNDCP | Bond with Embedded Call/Put | A bond that includes an embedded option allowing early redemption by either the issuer or the holder. |
| BNDWR | Bond with Warrant | A bond that includes a warrant giving the holder the right to purchase equity at a specified price. |
| EXOTI | Exotic Option | A non-standard option with complex features that differ from conventional options. |

## Securitization

| Code | Name | Description |
|---|---|---|
| CDSWP | Credit Default Swap | Transfers the credit exposure of fixed income products between parties. Provides the buyer protection against a credit event. |
| TRSWP | Total Return Swap | A swap agreement in which one party makes payments based on a set rate while the other makes payments based on the total return of an underlying asset. |
| CLNTE | Credit Linked Note | A structured note with an embedded credit default swap. |
| SCRMR | Securitization Market Risk | A securitization vehicle with market risk exposure. |
| SCRCR | Securitization Credit Risk | A securitization vehicle with credit risk exposure. |

## Credit Enhancement

| Code | Name | Description |
|---|---|---|
| CEG | Guarantee | Creates a relationship between a guarantor, an obligee, and a debtor, moving the exposure from the debtor to the guarantor. |
| CEC | Collateral | Creates a relationship between collateral, an obligee, and a debtor, covering the exposure from the debtor with the collateral. |
| BCS | Basic Credit Support | A basic credit support structure. |
