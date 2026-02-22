---
title: Core Concepts
description: Fundamental principles and concepts of the ACTUS Financial Reporting Framework
category: Framework
order: 1
---

# Core Concepts

Understanding the fundamental concepts of ACTUS is essential for implementing and working with the framework effectively.

## The ACTUS Data Model

### Contract Template
Every financial contract in ACTUS is defined by a **Contract Template** that consists of:

- **Contract Type (CT)**: Defines the specific type of contract (e.g., Principal at Maturity, Linear Amortizer)
- **Contract Terms**: Set of attributes that parameterize the contract behavior
- **Contract Events**: Timeline of events that affect the contract over its lifetime

### Contract Attributes

ACTUS contracts are fully specified through standardized attributes:

#### Mandatory Attributes
- **Contract Identifier (CID)**: Unique identifier for the contract
- **Contract Type (CT)**: One of the predefined ACTUS contract types
- **Status Date (SD)**: Reference date for contract analysis
- **Contract Deal Date (CDD)**: Date when the contract was agreed upon
- **Initial Exchange Date (IED)**: Date of initial cash exchange

#### Calendar Attributes
- **Day Count Convention (DCC)**: Method for calculating interest accruals
- **Business Day Convention (BDC)**: Rules for adjusting dates that fall on non-business days
- **End of Month Convention (EOMC)**: Rules for month-end date adjustments

#### Financial Attributes
- **Notional Principal (NT)**: The principal amount of the contract
- **Nominal Interest Rate (IPNR)**: The contractual interest rate
- **Currency (CURS)**: Currency denomination of cash flows

### Cash Flow Types

ACTUS generates standardized cash flows classified by type:

- **Principal Payments (PR)**: Repayments of the notional amount
- **Interest Payments (IP)**: Interest accruals and payments  
- **Fee Payments (FP)**: Various fees associated with the contract
- **Principal Drawing (PD)**: Disbursements of principal (for credit facilities)
- **Interest Accrual (IPAC)**: Accrued interest calculations
- **Principal Prepayment (PP)**: Early principal repayments

## Algorithmic Cash Flow Generation

### Deterministic Calculation
All cash flows in ACTUS are generated using deterministic algorithms:

1. **Event Schedule Generation**: Create timeline of contract events
2. **State Variable Updates**: Calculate contract state at each event
3. **Cash Flow Calculation**: Generate cash flows based on contract terms and state
4. **Risk Factor Application**: Apply market risk factors for scenario analysis

### State Variables
Key state variables tracked throughout contract life:

- **Notional Principal (NT)**: Current outstanding principal
- **Nominal Interest Rate (IPNR)**: Current applicable interest rate  
- **Accrued Interest (IPAC)**: Interest accrued since last payment
- **Performance Status**: Current contract performance status

## Risk Factor Integration

### Market Risk Factors
ACTUS integrates various market risk factors:

- **Interest Rate Curves**: Different curves for different currencies and terms
- **Credit Spread Curves**: Credit risk adjustments by rating and sector
- **Foreign Exchange Rates**: Currency conversion rates
- **Equity/Commodity Prices**: Market prices for indexed contracts

### Scenario Analysis
Apply different scenarios by varying risk factors:
- **Base Case**: Current market conditions
- **Stress Scenarios**: Adverse market condition testing
- **Monte Carlo**: Stochastic risk factor evolution

## Contract Performance Monitoring

### Performance Status
Track contract performance throughout its lifetime:

- **Performing (PF)**: Contract is current on all obligations
- **Delinquent (DL)**: Contract has missed payments but within cure period
- **Non-Performing (NP)**: Contract is in material default
- **Default (DF)**: Contract is in legal default

### Credit Events
Standard treatment of credit-related events:
- **Delinquency**: Late payment handling
- **Default**: Default event processing
- **Recovery**: Post-default recovery processes

## Regulatory & Accounting Integration

### Regulatory Reporting
ACTUS supports various regulatory frameworks:
- Standardized data collection
- Automated report generation
- Audit trail maintenance
- Stress testing capabilities

### Accounting Integration  
Support for major accounting standards:
- **IFRS 9**: Expected credit loss calculations
- **IFRS 17**: Insurance contract valuation
- **Basel III/IV**: Capital requirement calculations
- **CECL**: Current expected credit loss methodology

---

These core concepts form the foundation for all ACTUS implementations and should be thoroughly understood before proceeding with system integration.