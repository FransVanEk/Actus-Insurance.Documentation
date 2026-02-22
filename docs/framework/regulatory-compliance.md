---
title: Regulatory Compliance
description: Comprehensive guide to regulatory compliance frameworks supported by ACTUS
category: Framework
order: 3
---

# Regulatory Compliance

ACTUS provides comprehensive support for major regulatory and accounting frameworks used by financial institutions worldwide. This ensures consistent, auditable, and compliant financial reporting across all use cases.

## Banking Regulations

### Basel III/IV Framework

#### Capital Adequacy Requirements
ACTUS supports complete Basel III/IV capital calculations:

**Risk-Weighted Assets (RWA) Calculation:**
- **Credit Risk**: Standardized and IRB approaches
- **Market Risk**: Standardized and IMA approaches  
- **Operational Risk**: Standardized Measurement Approach (SMA)
- **CVA Risk**: Credit Valuation Adjustment capital

**Capital Ratio Calculations:**
```
Common Equity Tier 1 (CET1) Ratio = CET1 Capital / Total RWA ≥ 4.5%
Tier 1 Capital Ratio = Tier 1 Capital / Total RWA ≥ 6.0%
Total Capital Ratio = Total Capital / Total RWA ≥ 8.0%
```

**Capital Conservation Buffer:** Additional 2.5% CET1 requirement
**Countercyclical Buffer:** 0-2.5% based on systemic risk
**G-SIB Buffer:** Additional 1-3.5% for globally systemically important banks

#### Leverage Ratio
**Basel III Leverage Ratio:**
```
Leverage Ratio = Tier 1 Capital / Total Exposure ≥ 3%
```

Where Total Exposure includes:
- On-balance sheet exposures
- Derivative exposures
- Securities financing transactions
- Off-balance sheet exposures

#### Liquidity Requirements

**Liquidity Coverage Ratio (LCR):**
```
LCR = High Quality Liquid Assets / Net Cash Outflows (30 days) ≥ 100%
```

**Net Stable Funding Ratio (NSFR):**
```
NSFR = Available Stable Funding / Required Stable Funding ≥ 100%
```

### Large Exposure Framework
Monitor and limit large exposures:
- **Large Exposure Limit**: 25% of eligible capital
- **G-SIB Exposure Limit**: 15% of Tier 1 capital (between G-SIBs)
- **Connected Client Groups**: Aggregate exposures to related entities

### Fundamental Review of the Trading Book (FRTB)
**Standardized Approach:**
- Delta, Vega, and Curvature risk charges
- Default Risk Charge (DRC)
- Residual Risk Add-On (RRAO)

**Internal Models Approach (IMA):**
- Expected Shortfall (ES) at 97.5% confidence
- Non-modellable Risk Factors (NMRF) capital
- P&L Attribution tests

## Accounting Standards

### IFRS 9 - Financial Instruments

#### Classification and Measurement
**Business Model Assessment:**
- **Hold to Collect (HTC)**: Amortized Cost measurement
- **Hold to Collect and Sell (HTCS)**: Fair Value through OCI
- **Other**: Fair Value through Profit or Loss

**SPPI Test (Solely Payments of Principal and Interest):**
```python
def sppi_assessment(contract):
    # Basic loan features pass SPPI
    if contract.type in ['ANN', 'LAM', 'PAM']:
        return contract.has_basic_lending_features()
    
    # Complex features may fail SPPI
    if contract.has_embedded_derivatives():
        return False
    
    return contract.passes_sppi_test()
```

#### Expected Credit Loss (ECL) Model
**Three-Stage Approach:**

**Stage 1 - Performing Assets:**
- 12-month ECL provision
- No significant increase in credit risk
- Credit-adjusted effective interest rate

**Stage 2 - Underperforming Assets:**
- Lifetime ECL provision  
- Significant increase in credit risk (SICR)
- Credit-adjusted effective interest rate

**Stage 3 - Non-Performing Assets:**
- Lifetime ECL provision
- Credit-impaired status
- Interest on net carrying amount

**ECL Calculation:**
```
ECL = PD × LGD × EAD × DF
```
Where:
- PD = Probability of Default
- LGD = Loss Given Default  
- EAD = Exposure at Default
- DF = Discount Factor

#### Forward-Looking Information
Incorporate macroeconomic scenarios:
- **Base Case**: Most likely economic outlook (40-60% weight)
- **Upside Scenario**: Favorable conditions (20-30% weight)
- **Downside Scenario**: Adverse conditions (20-30% weight)

### IFRS 17 - Insurance Contracts

#### Contract Boundary Determination
Define contract boundaries for insurance-linked products:
- Enforceable rights and obligations
- Practical ability to set pricing
- Contract modifications and renewals

#### Measurement Models
**General Measurement Model (GMM):**
- Fulfillment cash flows
- Contractual service margin
- Loss component

**Variable Fee Approach (VFA):**
- For direct participation features
- Variable fee allocation
- Investment component separation

**Premium Allocation Approach (PAA):**
- Simplified measurement for short-duration contracts
- Eligibility criteria assessment
- Loss recovery component

### US GAAP - ASC 326 (CECL)

#### Current Expected Credit Loss (CECL)
**Day 1 Recognition:**
- Lifetime expected credit losses from origination
- No threshold for recognition
- Forward-looking estimates

**CECL Methodology:**
```python
def calculate_cecl(contract, economic_scenarios):
    lifetime_pd = calculate_lifetime_pd(contract, economic_scenarios)
    lifetime_lgd = calculate_lifetime_lgd(contract, economic_scenarios)
    outstanding_balance = contract.current_balance
    
    cecl = lifetime_pd * lifetime_lgd * outstanding_balance
    return cecl
```

**Reasonable and Supportable Information:**
- Historical experience
- Current conditions
- Reasonable forecasts

## Regional Regulatory Requirements

### European Union

#### Capital Requirements Regulation (CRR/CRD)
- EU implementation of Basel III
- Additional macro-prudential measures
- European Banking Authority (EBA) guidelines

#### European Central Bank (ECB) Requirements
- **Supervisory Review and Evaluation Process (SREP)**
- **Targeted Review of Internal Models (TRIM)**
- **Deep Dive investigations**

#### Markets in Financial Instruments Directive (MiFID II)
- Best execution requirements
- Transaction reporting
- Product governance obligations

### United States

#### Dodd-Frank Act Requirements
**Comprehensive Capital Analysis and Review (CCAR):**
- Annual stress testing for large banks
- Capital planning requirements
- Quantitative and qualitative assessments

**Diversity Financial Stress Testing (DFAST):**
- Mid-year stress testing
- Supervisory and bank-run scenarios
- Public disclosure requirements

#### Federal Reserve Requirements
- **SR 11-7**: Model Risk Management guidance
- **Enhanced Supplementary Leverage Ratio (eSLR)**: For G-SIBs
- **Total Loss-Absorbing Capacity (TLAC)**: Resolution planning

### Asia-Pacific

#### Bank for International Settlements (BIS) Implementation
- National discretions in Basel implementation
- Local regulatory add-ons
- Currency-specific requirements

#### Monetary Authority of Singapore (MAS)
- **Notice 637**: Credit risk management
- **Notice 649**: Interest rate risk in the banking book
- **Technology Risk Management Guidelines**

## Regulatory Reporting

### Automated Report Generation

#### Basel III Pillar 3 Reports
**Quantitative Disclosures:**
- Capital adequacy ratios
- Risk-weighted assets breakdown
- Credit risk exposures
- Market risk measures

**Qualitative Disclosures:**
- Risk management objectives
- Risk governance structure
- Capital management approach

#### Regulatory Capital Reports
**Call Report (US):**
```python
class CallReportGenerator:
    def generate_schedule_rc(self, balance_sheet_data):
        # Consolidated Balance Sheet
        return {
            'total_assets': balance_sheet_data.total_assets,
            'total_liabilities': balance_sheet_data.total_liabilities,
            'total_equity': balance_sheet_data.total_equity
        }
    
    def generate_schedule_rca(self, capital_data):
        # Risk-Based Capital
        return {
            'cet1_capital': capital_data.cet1_capital,
            'tier1_capital': capital_data.tier1_capital,
            'total_capital': capital_data.total_capital,
            'total_rwa': capital_data.total_rwa
        }
```

#### IFRS 9 Reporting
**ECL Reconciliation:**
- Opening balance
- Transfers between stages
- New originations
- Derecognitions
- Write-offs
- Closing balance

### Audit Trail & Documentation

#### Model Documentation Requirements
**Model Development:**
- Conceptual soundness
- Data quality assessment
- Model development process
- Performance testing

**Model Validation:**
- Independent validation
- Backtesting results
- Benchmarking analysis
- Sensitivity testing

**Model Governance:**
- Model inventory
- Approval processes
- Regular review cycles
- Issue remediation

#### Regulatory Examination Support
**On-site Examination Preparation:**
- Data room setup
- Document organization
- Process walkthroughs
- Regulatory correspondence

**Off-site Monitoring:**
- Regular metric reporting
- Early warning indicators
- Trend analysis
- Exception reporting

## Compliance Monitoring

### Key Risk Indicators (KRIs)
**Capital Adequacy:**
- CET1 ratio trends
- Leverage ratio monitoring
- Capital forecast accuracy
- Stress test performance

**Credit Risk:**
- Portfolio credit quality
- ECL model performance
- Large exposure monitoring
- Concentration limits

**Operational Risk:**
- Loss event frequency
- Control effectiveness
- Model performance
- Process reliability

### Regulatory Change Management
**Change Impact Assessment:**
- Regulatory interpretation
- System impact analysis
- Process modifications
- Training requirements

**Implementation Planning:**
- Regulatory deadlines
- System development
- Testing procedures
- Parallel running

### Quality Assurance
**Data Quality Frameworks:**
- Completeness checks
- Accuracy validation
- Consistency monitoring
- Timeliness metrics

**Process Controls:**
- Segregation of duties
- Authorization limits
- Review and approval
- Exception handling

---

This comprehensive regulatory compliance framework ensures that ACTUS implementations meet all applicable regulatory requirements while maintaining the flexibility to adapt to evolving regulatory landscapes. Professional implementation requires careful consideration of all applicable regulations in your specific jurisdiction.