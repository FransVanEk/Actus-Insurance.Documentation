---
title: Contract Types Overview
description: Overview of ACTUS contract types and their applications in financial modeling
category: Financial
order: 2
---

# Contract Types Overview

ACTUS defines a comprehensive taxonomy of financial contract types that cover the vast majority of financial instruments used in practice. Each contract type has a standardized algorithmic definition that ensures consistent cash flow generation.

## Principal Contract Types

### PAM - Principal at Maturity
**[Principal at Maturity](contract-types/pam)** contracts are the simplest form where:
- Principal is repaid in full at maturity
- Interest payments are made periodically
- No principal reduction during the life of the contract

**Common Applications:**
- Corporate bonds
- Government bonds  
- Interest-only loans
- Bullet loans

**Key Characteristics:**
- Fixed or floating interest rates
- Regular interest payment cycles
- Single principal repayment at maturity

### LAM - Linear Amortizer  
**[Linear Amortizer](contract-types/lam)** contracts feature:
- Equal principal payments over the contract life
- Decreasing interest payments as principal reduces
- Fixed total payment schedule

**Common Applications:**
- Traditional amortizing loans
- Mortgage loans with equal principal payments
- Equipment financing with straight-line amortization

### ANN - Annuity
**[Annuity](contract-types/ann)** contracts provide:
- Equal total payments (principal + interest) over contract life
- Varying split between principal and interest components
- Most common consumer lending structure

**Common Applications:**
- Residential mortgages
- Auto loans
- Personal loans
- Equipment financing

### NAM - Negative Amortization
**[Negative Amortization](contract-types/nam)** contracts allow:
- Payments less than accrued interest
- Growing principal balance over time
- Potential payment recasting events

**Common Applications:**
- Payment option mortgages
- Graduated payment mortgages
- Certain student loans

## Variable Principal Contract Types

### CLM - Call Money
**[Call Money](contract-types/clm)** contracts feature:
- Variable principal outstanding
- Interest calculated on current balance
- Flexible drawdown and repayment terms

**Common Applications:**
- Credit lines
- Revolving credit facilities
- Working capital facilities

### UMP - Undefined Maturity Profile
**[Undefined Maturity Profile](contract-types/ump)** contracts have:
- No predetermined repayment schedule
- Interest-only payments
- Principal callable by lender or borrower

**Common Applications:**
- Demand deposits
- Savings accounts
- Perpetual bonds

## Exotic Contract Types

### OPTNS - Options
**[Options](contract-types/optns)** contracts provide:
- Right but not obligation to exercise
- Various exercise styles and conditions
- Complex payoff structures

**Common Applications:**
- Financial derivatives
- Embedded options in bonds
- Employee stock options

### FUTUR - Futures
**[Futures](contract-types/futur)** contracts involve:
- Obligation to exchange assets at future date
- Daily mark-to-market settlements
- Margin requirements

**Common Applications:**
- Commodity futures
- Financial futures
- Interest rate futures

### SWAPS - Swaps
**[Swaps](contract-types/swaps)** contracts exchange:
- Cash flows based on different calculations
- Typically no principal exchange
- Various underlying rate indices

**Common Applications:**
- Interest rate swaps
- Currency swaps
- Credit default swaps

## Specialized Contract Types

### SWPPV - Plain Vanilla Swap
**[Plain Vanilla Swap](contract-types/swppv)** contracts:
- Exchange fixed for floating interest rate cash flows
- No principal exchanges
- Standardized terms and conditions

### CEG - Composite
**[Composite](contract-types/ceg)** contracts combine:
- Multiple underlying contract types
- Complex interdependencies
- Structured product representations

### CEC - Caplets/Floorlets
**[Caplets/Floorlets](contract-types/cec)** provide:
- Interest rate protection
- Periodic option settlements
- Portfolio hedging capabilities

## Risk Factor Dependencies

### Interest Rate Sensitive Contracts
Most ACTUS contracts depend on interest rate risk factors:
- **Reference Rate (RR)**: Base rate for floating rate calculations
- **Market Object Code (MOC)**: Identifier for specific rate index
- **Reset Frequency**: How often rates are updated

### Credit Risk Integration
Contract types incorporate credit risk through:
- **Credit Spread**: Additional margin over risk-free rate
- **Recovery Rate**: Expected recovery in default scenarios  
- **Performance Status**: Current contract performance state

### Currency Dependencies
Multi-currency contracts require:
- **Settlement Currency**: Currency for cash flow payments
- **Contract Currency**: Currency for contract denomination
- **Foreign Exchange Rates**: Conversion rates between currencies

## Selection Guidelines

### Loan Products
- **Fixed Rate Loans**: PAM (interest-only) or ANN (amortizing)
- **Variable Rate Loans**: LAM or ANN with floating rate references
- **Credit Facilities**: CLM for revolving structures

### Investment Products
- **Bonds**: PAM for most corporate and government bonds
- **Structured Products**: CEG for complex instruments
- **Derivatives**: OPTNS, FUTUR, SWAPS based on specific structure

### Banking Products
- **Deposits**: UMP for demand deposits, PAM for term deposits
- **Credit Cards**: CLM for revolving credit
- **Mortgages**: ANN for standard mortgages, NAM for specialized products

---

Each contract type has detailed specifications including mandatory and optional contract terms, event definitions, and calculation algorithms. Refer to the specific contract type documentation for implementation details.