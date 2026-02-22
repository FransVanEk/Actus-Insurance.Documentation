---
title: Risk Management & Analysis
description: Comprehensive guide to risk management capabilities and analysis tools in ACTUS
category: Financial
order: 3
---

# Risk Management & Analysis

ACTUS provides sophisticated risk management capabilities that enable financial institutions to perform comprehensive risk analysis across their entire portfolio of financial contracts.

## Risk Factor Framework

### Market Risk Factors
ACTUS integrates various market risk factors for comprehensive analysis:

#### Interest Rate Risk
- **Risk-Free Curves**: Government bond yield curves by currency and maturity
- **Credit Spread Curves**: Corporate credit spreads by rating, sector, and maturity  
- **LIBOR/SOFR Curves**: Benchmark rates for floating rate instruments
- **Basis Risk**: Spread differentials between different rate indices

#### Foreign Exchange Risk
- **Spot Rates**: Current currency exchange rates
- **Forward Curves**: Forward exchange rate projections
- **Volatility**: FX option implied volatilities
- **Correlation**: Cross-currency correlations

#### Credit Risk
- **Probability of Default (PD)**: Default probabilities by rating and time horizon
- **Loss Given Default (LGD)**: Expected loss rates in default scenarios
- **Exposure at Default (EAD)**: Outstanding exposure amounts at default
- **Credit Migration**: Rating transition matrices

#### Equity & Commodity Risk  
- **Equity Prices**: Stock prices and indices for equity-linked products
- **Commodity Prices**: Commodity reference prices for indexed contracts
- **Volatility Surfaces**: Option implied volatilities by strike and maturity
- **Dividend Yields**: Expected dividend streams

### Risk Factor Application

Risk factors are applied systematically across all contract types:

```python
class RiskFactorEngine:
    def apply_risk_factors(self, contract, scenario):
        # Apply interest rate curves
        if contract.has_floating_rate():
            rate = self.get_interest_rate(
                curve_id=contract.reference_rate,
                date=contract.rate_reset_date,
                scenario=scenario
            )
            contract.apply_rate_reset(rate)
        
        # Apply credit spreads
        if contract.has_credit_risk():
            spread = self.get_credit_spread(
                rating=contract.borrower_rating,
                sector=contract.borrower_sector,
                scenario=scenario
            )
            contract.apply_credit_spread(spread)
        
        # Apply FX rates for multi-currency
        if contract.is_multi_currency():
            fx_rate = self.get_fx_rate(
                currency_pair=contract.currency_pair,
                date=contract.settlement_date,
                scenario=scenario
            )
            contract.apply_fx_conversion(fx_rate)
```

## Scenario Analysis

### Base Case Scenario
The base case represents current market conditions using:
- Current market interest rate curves
- Current credit spreads
- Spot foreign exchange rates
- Current equity/commodity prices
- Expected contract performance

### Stress Scenarios

#### Regulatory Stress Tests
**Basel III/IV Stress Tests:**
- Interest rate shocks (parallel shifts of ±200bp)
- Credit spread widening scenarios
- Equity market declines (-30% to -50%)
- Real estate price corrections
- Recession scenarios with elevated defaults

**CECL (Current Expected Credit Losses):**
- Base case economic forecast
- Downside economic scenarios
- Severe recession scenarios
- Industry-specific stress factors

#### Custom Stress Scenarios
**Interest Rate Stress:**
- Parallel curve shifts
- Curve steepening/flattening
- Basis risk scenarios
- Volatility stress

**Credit Stress:**
- Rating downgrades
- Spread widening
- Default rate increases
- Recovery rate decreases

**Market Stress:**
- Equity market crashes
- Currency devaluations
- Commodity price volatility
- Liquidity crises

### Monte Carlo Simulation

ACTUS supports stochastic scenario generation for:

#### Path Generation
```python
class MonteCarloEngine:
    def generate_scenarios(self, num_paths=10000, time_horizon=5):
        paths = []
        for i in range(num_paths):
            path = self.simulate_path(
                initial_values=self.current_market_data,
                volatilities=self.volatility_parameters,
                correlations=self.correlation_matrix,
                time_steps=time_horizon * 12  # Monthly steps
            )
            paths.append(path)
        return paths
    
    def simulate_path(self, initial_values, volatilities, correlations, time_steps):
        # Implement correlated random walks for risk factors
        # Using Cholesky decomposition for correlation
        pass
```

#### Statistical Measures
- **Value at Risk (VaR)**: 95th, 99th, 99.9th percentiles
- **Expected Shortfall (ES)**: Expected loss beyond VaR threshold
- **Maximum Drawdown**: Worst-case scenario loss
- **Probability of Loss**: Likelihood of negative outcomes

## Risk Metrics Calculation

### Duration & Convexity
**Modified Duration:**
```
Modified Duration = -1/P × ∂P/∂y
```
Where P is the present value and y is the yield.

**Effective Duration** (for options-embedded securities):
```
Effective Duration = (P- - P+) / (2 × P0 × Δy)
```

**Convexity:**
```
Convexity = 1/P × ∂²P/∂y²
```

### Credit Risk Metrics

#### Expected Credit Loss (ECL)
**12-Month ECL:**
```
ECL = EAD × PD × LGD
```

**Lifetime ECL:**
```
ECL = Σ[EAD(t) × PD(t) × LGD(t)]
```
For all future periods t.

#### Economic Capital
Based on unexpected losses using internal models:
```
Economic Capital = VaR(99.9%) - Expected Loss
```

### Market Risk Metrics

#### Value at Risk (VaR)
**Parametric VaR:**
```
VaR = Portfolio Value × Volatility × Z-score × √Time
```

**Historical VaR:**
Based on historical portfolio P&L distribution.

**Monte Carlo VaR:**
Based on simulated portfolio value changes.

#### Greeks (for options-embedded contracts)
- **Delta**: Price sensitivity to underlying asset
- **Gamma**: Convexity of delta
- **Theta**: Time decay sensitivity
- **Vega**: Volatility sensitivity
- **Rho**: Interest rate sensitivity

## Portfolio-Level Analysis

### Risk Aggregation
ACTUS aggregates risks across multiple dimensions:

#### By Contract Type
- Mortgages vs. Corporate loans
- Fixed rate vs. Floating rate
- Domestic vs. Foreign currency

#### By Geographic Region
- Country-specific risk factors
- Regional economic correlations
- Currency exposure by region

#### By Industry Sector
- Sector concentration limits
- Industry-specific stress factors
- Correlation analysis

### Correlation Management
**Risk Factor Correlations:**
```python
correlation_matrix = {
    ('USD_3M_RATE', 'EUR_3M_RATE'): 0.65,
    ('USD_3M_RATE', 'CREDIT_SPREAD_AAA'): -0.45,
    ('EQUITY_SPX', 'CREDIT_SPREAD_BBB'): -0.72,
    ('USD_EUR_FX', 'EUR_3M_RATE'): 0.23
}
```

### Concentration Risk
Monitor and limit concentrations by:
- **Single Name**: Maximum exposure to individual borrowers
- **Industry**: Sectoral concentration limits
- **Geographic**: Regional exposure limits
- **Product Type**: Diversification across contract types

## Regulatory Capital

### Basel III/IV Implementation

#### Risk-Weighted Assets (RWA)
**Credit Risk RWA:**
```
RWA = EAD × Risk Weight × Maturity Adjustment
```

**Market Risk RWA:**
- Standardized Approach
- Internal Models Approach (IMA)
- Fundamental Review of the Trading Book (FRTB)

**Operational Risk RWA:**
- Standardized Measurement Approach (SMA)

#### Capital Ratios
**Common Equity Tier 1 (CET1) Ratio:**
```
CET1 Ratio = CET1 Capital / Total RWA
```

**Tier 1 Capital Ratio:**
```
Tier 1 Ratio = (CET1 + AT1 Capital) / Total RWA  
```

**Total Capital Ratio:**
```
Total Capital Ratio = (Tier 1 + Tier 2 Capital) / Total RWA
```

### IFRS 9/17 Implementation

#### Classification & Measurement
- **Amortized Cost**: Hold-to-collect business model
- **Fair Value through OCI**: Hold-to-collect and sell
- **Fair Value through P&L**: Other business models

#### Impairment (ECL Model)
- **Stage 1**: 12-month ECL for performing assets
- **Stage 2**: Lifetime ECL for underperforming assets  
- **Stage 3**: Lifetime ECL for non-performing assets

## Stress Testing Framework

### Regulatory Stress Tests

#### DFAST/CCAR (US)
- Baseline scenario
- Adverse scenario  
- Severely adverse scenario
- 9-quarter projection horizon

#### EBA Stress Tests (EU)
- Baseline scenario
- Adverse scenario
- 3-year projection horizon
- Bank-specific elements

### Internal Stress Testing
- Top-down macro scenarios
- Bottom-up portfolio stress
- Reverse stress testing
- Model validation stress tests

## Risk Reporting

### Management Reporting
- **Risk Dashboard**: Key risk metrics and limits
- **Portfolio Analytics**: Performance and risk attribution
- **Scenario Analysis**: Stress test results
- **Concentration Reports**: Risk concentrations and limits

### Regulatory Reporting
- **Basel III Pillar 3**: Market disclosure requirements
- **CECL Reports**: Credit loss provisions
- **Stress Test Results**: Regulatory stress test submissions
- **Risk Appetite**: Risk appetite framework reporting

### Audit & Validation
- **Model Documentation**: Risk model specifications
- **Validation Results**: Model performance testing
- **Backtesting**: Historical performance validation
- **Benchmarking**: Comparison with industry practices

---

This comprehensive risk management framework enables financial institutions to maintain robust risk oversight while meeting all regulatory requirements for professional financial services organizations.