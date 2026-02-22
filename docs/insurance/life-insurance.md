---
title: Life Insurance Contracts
description: ACTUS modeling for life insurance products including term life, whole life, and universal life policies
category: Insurance
order: 2
---

# Life Insurance Contracts

Life insurance contracts represent some of the most complex financial instruments, combining mortality risk, investment components, and long-term cash flow patterns. ACTUS provides standardized modeling approaches for all major life insurance product types.

## Contract Types Overview

### Term Life Insurance (TLI)
**Basic Structure:**
- Temporary coverage for a specified term (1-30 years)
- Level or decreasing death benefit
- Level, increasing, or decreasing premiums
- No cash value accumulation

**Key Characteristics:**
- **Mortality Risk**: Primary risk factor affecting claims
- **Lapse Risk**: Policyholder surrender before maturity
- **Interest Rate Risk**: Minimal due to short duration
- **Premium Structure**: Level, annual renewable, or decreasing term

**ACTUS Modeling:**
```
Contract Type: TLI (Term Life Insurance)
Cash Flow Pattern: 
  - Regular premium receipts
  - Death benefit payments based on mortality tables
  - Surrender benefits (typically zero)
  - Commission and expense deductions
```

### Whole Life Insurance (WLI)
**Basic Structure:**
- Permanent coverage until death or age 100+
- Level death benefit with cash value accumulation
- Level premium payments
- Guaranteed cash values and death benefits

**Key Characteristics:**
- **Investment Component**: Cash value grows at guaranteed rate
- **Mortality Risk**: Lifetime mortality exposure
- **Interest Rate Risk**: Long-duration liability sensitivity
- **Policyholder Options**: Loans, surrenders, paid-up options

**ACTUS Modeling:**
```
Contract Type: WLI (Whole Life Insurance)
Components:
  - Mortality charge calculations
  - Cash value accumulation at guaranteed rate
  - Policy loan provisions and interest
  - Dividend participation (if applicable)
```

### Universal Life Insurance (ULI)  
**Basic Structure:**
- Flexible premium and death benefit
- Separate account for cash value accumulation
- Current interest rates (market-based)
- Transparent fee structure

**Key Characteristics:**
- **Flexibility**: Adjustable premiums and death benefits
- **Interest Rate Sensitivity**: Cash values tied to current rates
- **Fee Transparency**: Explicit charges for insurance and expenses
- **Investment Options**: Money market or bond fund accumulation

**ACTUS Modeling:**
```
Contract Type: ULI (Universal Life Insurance)
Features:
  - Flexible premium processing
  - Current interest rate crediting
  - Monthly mortality and expense charges
  - Cash value accumulation tracking
  - Death benefit option modeling (Level vs. Increasing)
```

### Variable Life Insurance (VLI)
**Basic Structure:**
- Fixed premiums with variable investment options
- Cash values fluctuate with investment performance
- Minimum death benefit guarantees
- Policyholder investment control

**Key Characteristics:**
- **Investment Risk**: Policyholder bears investment risk
- **Minimum Guarantees**: Floor protection on death benefits
- **Regulatory Requirements**: Securities registration and compliance
- **Performance Dependent**: Cash values vary with market performance

## Actuarial Assumptions

### Mortality Tables
**Standard Tables:**
- **2017 CSO**: Commissioner's Standard Ordinary mortality table
- **2012 IAM**: Individual Annuity Mortality table
- **Company-Specific**: Experience-based mortality assumptions
- **Generational Tables**: Mortality improvement projections

**Usage in ACTUS:**
- Baseline mortality rates by age, sex, and underwriting class
- Mortality improvement factors for future projections
- Shock and stress testing scenarios
- Regulatory reserve calculation compliance

### Interest Rate Assumptions
**Valuation Rates:**
- **Guaranteed Rates**: Contractual minimum crediting rates
- **Current Rates**: Market-competitive rates for new business
- **Projected Rates**: Forward-looking rate scenarios
- **Regulatory Rates**: Prescribed rates for reserve calculations

### Lapse and Surrender Rates
**Behavioral Modeling:**
- **Level Lapse Rates**: Consistent annual withdrawal rates
- **Dynamic Lapse**: Rate sensitivity to interest rates and performance
- **Shock Lapse**: Sudden mass surrenders under adverse conditions
- **Ultimate Lapse Rates**: Long-term persistent policyholder behavior

## Regulatory Considerations

### Reserve Requirements
**Statutory Reserves:**
- **Commissioners' Reserve Valuation Method (CRVM)**: U.S. statutory reserves
- **Principles-Based Reserves (PBR)**: Risk-based reserve calculations
- **GAAP Reserves**: Financial reporting under accounting standards
- **Economic Reserves**: Market-consistent valuation approaches

### Capital Requirements
**Risk-Based Capital (RBC):**
- **C1 Risk**: Asset risk including credit and market risk
- **C2 Risk**: Insurance risk including mortality and morbidity
- **C3 Risk**: Interest rate risk and asset/liability matching
- **C4 Risk**: Business risk including pricing and concentration

### IFRS 17 Compliance
**Measurement Models:**
- **General Measurement Model (GMM)**: Default IFRS 17 approach
- **Premium Allocation Approach (PAA)**: Simplified model for short-duration contracts
- **Variable Fee Approach (VFA)**: For contracts with direct participation features
- **Risk Adjustment**: Compensation for uncertainty in cash flows

## Cash Flow Modeling

### Premium Processing
```
Monthly Premium Collection:
1. Gross premium receipt
2. Premium tax deductions
3. Agent commission calculations
4. Net premium available for benefits and expenses
```

### Benefit Calculations
```
Death Benefit Determination:
1. Base death benefit amount
2. Cash value accumulation (if applicable)
3. Outstanding policy loans
4. Final net death benefit payment
```

### Cash Value Accumulation
```
Universal Life Cash Value Growth:
1. Beginning cash value balance
2. Premium deposits (less charges)
3. Interest crediting at current rates
4. Monthly mortality and expense charges
5. Ending cash value balance
```

## Professional Implementation

### For Insurance Companies
- **Product Development**: New product design and pricing
- **Valuation Systems**: Reserve and capital calculations
- **Risk Management**: Asset-liability management and hedging
- **Regulatory Reporting**: Statutory and GAAP financial statements

### For Actuaries
- **Assumption Setting**: Mortality, lapse, and interest rate assumptions
- **Experience Analysis**: Actual vs. expected performance monitoring
- **Profitability Testing**: Product line profitability analysis
- **Capital Modeling**: Economic and regulatory capital requirements

### For Regulators
- **Solvency Monitoring**: Company financial strength assessment
- **Product Approval**: New product review and approval processes
- **Market Conduct**: Consumer protection and fair practice enforcement
- **Systemic Risk**: Industry-wide risk monitoring and analysis

---

Life insurance contracts require sophisticated modeling to capture their long-term nature, embedded options, and regulatory requirements. ACTUS provides the standardized framework to ensure consistent and transparent modeling across the industry.