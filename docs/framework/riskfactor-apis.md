---
title: Risk Factor APIs
description: Comprehensive reference for managing market risk factors, scenarios, and time series data
category: APIs
parent: framework/api-guide
order: 5
---

# Risk Factor APIs

The Risk Factor APIs provide comprehensive functionality for managing market risk factors, including interest rates, foreign exchange rates, credit spreads, and equity indices that drive contract valuations and cash flow generation.

## Overview

Risk factors are fundamental market variables that impact financial contract valuations. The ACTUS Framework supports:

- **Interest Rate Curves**: Government bonds, LIBOR, OIS, corporate bonds
- **Foreign Exchange Rates**: Major and minor currency pairs
- **Credit Spreads**: Corporate, sovereign, and sector-specific spreads  
- **Equity Indices**: Market indices and individual stock prices
- **Commodity Prices**: Energy, metals, agricultural products
- **Volatility Surfaces**: Options pricing and risk models

## Risk Factor Management

### Create Risk Factor
Register a new risk factor for use in the system.

```http
POST /v1/risk-factors
```

**Request Body:**
```json
{
  "marketObjectCode": "USD_SOFR_3M",
  "name": "USD SOFR 3 Month",
  "description": "US Dollar Secured Overnight Financing Rate 3 Month",
  "riskFactorType": "InterestRate",
  "currency": "USD",
  "tenor": "3M",
  "dataSource": "Bloomberg",
  "businessDayConvention": "ModifiedFollowing",
  "calendar": "NYC",
  "metadata": {
    "sector": "Government",
    "jurisdiction": "United States",
    "benchmark": true
  }
}
```

**Response:**
```json
{
  "marketObjectCode": "USD_SOFR_3M",
  "name": "USD SOFR 3 Month", 
  "riskFactorType": "InterestRate",
  "currency": "USD",
  "status": "active",
  "href": "/v1/risk-factors/USD_SOFR_3M",
  "createdAt": "2024-01-15T10:30:00Z",
  "version": 1
}
```

### Get Risk Factor Details
Retrieve risk factor metadata and configuration.

```http
GET /v1/risk-factors/{marketObjectCode}
```

**Response:**
```json
{
  "marketObjectCode": "USD_SOFR_3M",
  "name": "USD SOFR 3 Month",
  "description": "US Dollar Secured Overnight Financing Rate 3 Month",
  "riskFactorType": "InterestRate", 
  "currency": "USD",
  "tenor": "3M",
  "dataSource": "Bloomberg",
  "businessDayConvention": "ModifiedFollowing",
  "calendar": "NYC",
  "status": "active",
  "statistics": {
    "firstDataDate": "2018-04-03T00:00:00Z",
    "lastDataDate": "2024-01-15T00:00:00Z",
    "totalObservations": 1521,
    "currentValue": 0.0532,
    "meanValue": 0.0387,
    "volatility": 0.0245,
    "minValue": 0.0001,
    "maxValue": 0.0852
  },
  "metadata": {
    "sector": "Government",
    "jurisdiction": "United States", 
    "benchmark": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### List Risk Factors
Search and filter available risk factors.

```http
GET /v1/risk-factors
```

**Query Parameters:**
- `riskFactorType` (string): Filter by type (`InterestRate`, `ForeignExchangeRate`, `CreditSpread`, `EquityPrice`, etc.)
- `currency` (string): Filter by currency code
- `search` (string): Text search in name and description
- `status` (string): Filter by status (`active`, `inactive`, `deprecated`)
- `limit` (number): Results per page (default: 100)
- `offset` (number): Pagination offset

**Response:**
```json
{
  "riskFactors": [
    {
      "marketObjectCode": "USD_SOFR_3M",
      "name": "USD SOFR 3 Month",
      "riskFactorType": "InterestRate",
      "currency": "USD",
      "currentValue": 0.0532,
      "lastUpdated": "2024-01-15T16:00:00Z",
      "href": "/v1/risk-factors/USD_SOFR_3M"
    },
    {
      "marketObjectCode": "EUR_EURIBOR_6M",
      "name": "EUR EURIBOR 6 Month", 
      "riskFactorType": "InterestRate",
      "currency": "EUR",
      "currentValue": 0.0387,
      "lastUpdated": "2024-01-15T16:00:00Z",
      "href": "/v1/risk-factors/EUR_EURIBOR_6M"
    }
  ],
  "pagination": {
    "total": 847,
    "limit": 100,
    "offset": 0,
    "hasNext": true
  }
}
```

## Time Series Data Management

### Upload Risk Factor Data
Upload historical or real-time risk factor observations.

```http
POST /v1/risk-factors/{marketObjectCode}/data
```

**Request Body:**
```json
{
  "observations": [
    {
      "date": "2024-01-15T00:00:00Z",
      "value": 0.0532,
      "source": "Bloomberg",
      "quality": "verified"
    },
    {
      "date": "2024-01-16T00:00:00Z", 
      "value": 0.0535,
      "source": "Bloomberg",
      "quality": "verified"
    },
    {
      "date": "2024-01-17T00:00:00Z",
      "value": 0.0529,
      "source": "Bloomberg", 
      "quality": "preliminary"
    }
  ],
  "overwriteMode": "append"
}
```

**Response:**
```json
{
  "marketObjectCode": "USD_SOFR_3M",
  "uploaded": 3,
  "skipped": 0,
  "errors": 0,
  "summary": {
    "firstDate": "2024-01-15T00:00:00Z",
    "lastDate": "2024-01-17T00:00:00Z",
    "dataPoints": 3
  },
  "warnings": [
    {
      "date": "2024-01-17T00:00:00Z",
      "message": "Data quality marked as preliminary"
    }
  ]
}
```

### Retrieve Time Series Data
Get historical risk factor observations.

```http
GET /v1/risk-factors/{marketObjectCode}/data
```

**Query Parameters:**
- `startDate` (string): ISO 8601 start date  
- `endDate` (string): ISO 8601 end date
- `frequency` (string): Data frequency (`daily`, `weekly`, `monthly`)
- `interpolation` (string): Fill missing values (`none`, `linear`, `forward_fill`)
- `format` (string): Response format (`json`, `csv`)

**Response:**
```json
{
  "marketObjectCode": "USD_SOFR_3M",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-17T00:00:00Z", 
  "frequency": "daily",
  "observations": [
    {
      "date": "2024-01-01T00:00:00Z",
      "value": 0.0525,
      "source": "Bloomberg",
      "quality": "verified"
    },
    {
      "date": "2024-01-02T00:00:00Z",
      "value": 0.0528,
      "source": "Bloomberg",
      "quality": "verified"
    },
    {
      "date": "2024-01-03T00:00:00Z",
      "value": 0.0530,
      "source": "Bloomberg",
      "quality": "verified"
    }
  ],
  "statistics": {
    "count": 17,
    "mean": 0.0531,
    "stdDev": 0.0012,
    "min": 0.0525,
    "max": 0.0545
  }
}
```

## Risk Factor Interpolation

### Interpolate Missing Values
Fill gaps in risk factor time series using various interpolation methods.

```http
POST /v1/risk-factors/{marketObjectCode}/interpolate
```

**Request Body:**
```json
{
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-31T00:00:00Z",
  "interpolationMethod": "cubic_spline",
  "businessDaysOnly": true,
  "calendar": "NYC",
  "extrapolationMode": "constant"
}
```

**Response:**
```json
{
  "marketObjectCode": "USD_SOFR_3M",
  "interpolationMethod": "cubic_spline",
  "interpolatedObservations": [
    {
      "date": "2024-01-05T00:00:00Z",
      "value": 0.0527,
      "interpolated": true,
      "confidence": 0.95
    }
  ],
  "summary": {
    "totalRequested": 23,
    "originalValues": 19,
    "interpolatedValues": 4,
    "interpolationQuality": "high"
  }
}
```

## Curve Construction

### Build Interest Rate Curve  
Construct interest rate curves from market instruments.

```http
POST /v1/risk-factors/curves/construct
```

**Request Body:**
```json
{
  "curveID": "USD_TREASURY_CURVE_20240115",
  "currency": "USD",
  "curveType": "zero_coupon",
  "baseDate": "2024-01-15T00:00:00Z",
  "instruments": [
    {
      "instrumentType": "deposit",
      "tenor": "1M",
      "rate": 0.0520,
      "marketObjectCode": "USD_SOFR_1M"
    },
    {
      "instrumentType": "deposit", 
      "tenor": "3M",
      "rate": 0.0532,
      "marketObjectCode": "USD_SOFR_3M"
    },
    {
      "instrumentType": "swap",
      "tenor": "1Y", 
      "rate": 0.0465,
      "marketObjectCode": "USD_IRS_1Y"
    },
    {
      "instrumentType": "swap",
      "tenor": "5Y",
      "rate": 0.0425,
      "marketObjectCode": "USD_IRS_5Y"
    },
    {
      "instrumentType": "bond",
      "tenor": "10Y",
      "rate": 0.0445,
      "marketObjectCode": "USD_TREASURY_10Y"
    }
  ],
  "interpolationMethod": "cubic_spline",
  "extrapolationMethod": "flat_forward" 
}
```

**Response:**
```json
{
  "curveID": "USD_TREASURY_CURVE_20240115",
  "currency": "USD",
  "baseDate": "2024-01-15T00:00:00Z",
  "curvePoints": [
    {
      "tenor": "1D",
      "rate": 0.0520,
      "discountFactor": 0.999856
    },
    {
      "tenor": "1W", 
      "rate": 0.0520,
      "discountFactor": 0.998998
    },
    {
      "tenor": "1M",
      "rate": 0.0520, 
      "discountFactor": 0.995667
    },
    {
      "tenor": "3M",
      "rate": 0.0532,
      "discountFactor": 0.986899
    },
    {
      "tenor": "1Y",
      "rate": 0.0465,
      "discountFactor": 0.955234
    },
    {
      "tenor": "5Y", 
      "rate": 0.0425,
      "discountFactor": 0.808965
    },
    {
      "tenor": "10Y",
      "rate": 0.0445,
      "discountFactor": 0.636234
    }
  ],
  "constructionQuality": {
    "maxResidual": 0.0001,
    "averageResidual": 0.00003,
    "r_squared": 0.9998
  }
}
```

## Scenario Management

### Create Risk Scenario
Define risk factor scenarios for stress testing and Monte Carlo simulation.

```http
POST /v1/risk-factors/scenarios
```

**Request Body:**
```json
{
  "scenarioID": "STRESS_2024_Q1",
  "name": "Q1 2024 Stress Scenario",
  "description": "Extreme market stress with rate volatility and credit spread widening",
  "scenarioType": "stress",
  "validFrom": "2024-01-15T00:00:00Z",
  "validTo": "2024-12-31T23:59:59Z",
  "riskFactorShocks": [
    {
      "marketObjectCode": "USD_SOFR_3M",
      "shockType": "absolute", 
      "shockValue": 0.02,
      "shockDate": "2024-02-01T00:00:00Z"
    },
    {
      "marketObjectCode": "EUR_FX_USD",
      "shockType": "relative",
      "shockValue": -0.15,
      "shockDate": "2024-02-01T00:00:00Z"
    },
    {
      "marketObjectCode": "US_CORP_BBB_SPREAD",
      "shockType": "absolute",
      "shockValue": 0.005,
      "shockDate": "2024-02-01T00:00:00Z"
    }
  ],
  "correlations": [
    {
      "factor1": "USD_SOFR_3M",
      "factor2": "US_CORP_BBB_SPREAD", 
      "correlation": 0.65
    }
  ]
}
```

**Response:**
```json
{
  "scenarioID": "STRESS_2024_Q1",
  "name": "Q1 2024 Stress Scenario",
  "status": "active",
  "validationResults": {
    "isValid": true,
    "warnings": [
      "Large EUR/USD shock may cause extreme correlation effects"
    ]
  },
  "affectedRiskFactors": 3,
  "href": "/v1/risk-factors/scenarios/STRESS_2024_Q1",
  "createdAt": "2024-01-15T11:45:00Z"
}
```

### Generate Monte Carlo Paths
Generate stochastic paths for Monte Carlo simulation.

```http
POST /v1/risk-factors/monte-carlo/generate
```

**Request Body:**
```json
{
  "riskFactors": [
    "USD_SOFR_3M",
    "EUR_EURIBOR_6M",
    "EUR_FX_USD"
  ],
  "baseDate": "2024-01-15T00:00:00Z",
  "horizon": "2Y",
  "frequency": "monthly",
  "simulationCount": 10000,
  "randomSeed": 12345,
  "models": {
    "USD_SOFR_3M": {
      "modelType": "vasicek",
      "parameters": {
        "meanReversion": 0.15,
        "longTermMean": 0.04,
        "volatility": 0.008
      }
    },
    "EUR_EURIBOR_6M": {
      "modelType": "hull_white",
      "parameters": {
        "meanReversion": 0.12,
        "volatility": 0.009
      }
    },
    "EUR_FX_USD": {
      "modelType": "geometric_brownian",
      "parameters": {
        "drift": -0.02,
        "volatility": 0.12
      }
    }
  },
  "correlationMatrix": [
    [1.0, 0.75, -0.15],
    [0.75, 1.0, -0.12], 
    [-0.15, -0.12, 1.0]
  ]
}
```

**Response:**
```json
{
  "simulationID": "mc_sim_20240115_001",
  "status": "completed",
  "simulationCount": 10000,
  "pathsGenerated": 10000,
  "executionTime": "15.3s",
  "pathSummary": {
    "USD_SOFR_3M": {
      "initialValue": 0.0532,
      "finalMean": 0.0498,
      "finalStdDev": 0.0087,
      "minPath": 0.0123,
      "maxPath": 0.0943
    },
    "EUR_EURIBOR_6M": {
      "initialValue": 0.0387,
      "finalMean": 0.0401,
      "finalStdDev": 0.0092,
      "minPath": 0.0098,
      "maxPath": 0.0876
    },
    "EUR_FX_USD": {
      "initialValue": 0.85,
      "finalMean": 0.834,
      "finalStdDev": 0.089,  
      "minPath": 0.612,
      "maxPath": 1.123
    }
  },
  "downloadLinks": {
    "fullPaths": "/v1/downloads/mc_sim_20240115_001/paths.csv",
    "summary": "/v1/downloads/mc_sim_20240115_001/summary.json"
  }
}
```

## Real-time Market Data

### Subscribe to Real-time Updates
Stream real-time risk factor updates via WebSocket.

```http
GET /v1/risk-factors/stream
```

**Query Parameters:**
- `riskFactors` (array): List of risk factors to subscribe to
- `updateFrequency` (string): Update frequency (`realtime`, `1min`, `5min`)

**WebSocket Connection:**
```javascript
const ws = new WebSocket('wss://api.actus.org/v1/risk-factors/stream?riskFactors=USD_SOFR_3M,EUR_EURIBOR_6M&token=<access_token>');

ws.onmessage = function(event) {
  const update = JSON.parse(event.data);
};
```

**WebSocket Message Format:**
```json
{
  "eventType": "risk_factor_update",
  "marketObjectCode": "USD_SOFR_3M",
  "timestamp": "2024-01-15T16:23:45Z",
  "value": 0.0535,
  "previousValue": 0.0532,
  "change": 0.0003,
  "changePercent": 0.56,
  "source": "Bloomberg",
  "quality": "verified"
}
```

## Risk Factor Analytics

### Calculate Correlations
Compute historical correlations between risk factors.

```http
POST /v1/risk-factors/analytics/correlations
```

**Request Body:**
```json
{
  "riskFactors": [
    "USD_SOFR_3M",
    "EUR_EURIBOR_6M", 
    "GBP_SONIA_3M",
    "EUR_FX_USD", 
    "GBP_FX_USD"
  ],
  "startDate": "2023-01-01T00:00:00Z",
  "endDate": "2024-01-15T00:00:00Z",
  "frequency": "daily",
  "method": "pearson"
}
```

**Response:**
```json
{
  "correlationMatrix": [
    [1.000, 0.752, 0.689, -0.234, -0.187],
    [0.752, 1.000, 0.698, -0.456, -0.312], 
    [0.689, 0.698, 1.000, -0.198, -0.587],
    [-0.234, -0.456, -0.198, 1.000, 0.789],
    [-0.187, -0.312, -0.587, 0.789, 1.000]
  ],
  "riskFactorLabels": [
    "USD_SOFR_3M",
    "EUR_EURIBOR_6M",
    "GBP_SONIA_3M", 
    "EUR_FX_USD",
    "GBP_FX_USD"
  ],
  "statisticalSignificance": [
    [null, 0.001, 0.001, 0.001, 0.001],
    [0.001, null, 0.001, 0.001, 0.001],
    [0.001, 0.001, null, 0.001, 0.001],
    [0.001, 0.001, 0.001, null, 0.001],
    [0.001, 0.001, 0.001, 0.001, null]
  ],
  "analysisMetadata": {
    "startDate": "2023-01-01T00:00:00Z",
    "endDate": "2024-01-15T00:00:00Z",
    "observations": 379,
    "method": "pearson"
  }
}
```

### Historical Volatility Analysis
Calculate rolling volatilities and risk metrics.

```http
POST /v1/risk-factors/analytics/volatility
```

**Request Body:**
```json
{
  "marketObjectCode": "USD_SOFR_3M",
  "startDate": "2023-01-01T00:00:00Z",
  "endDate": "2024-01-15T00:00:00Z",
  "windowSize": 30,
  "annualizationFactor": 252
}
```

**Response:**
```json
{
  "marketObjectCode": "USD_SOFR_3M",
  "volatilityAnalysis": [
    {
      "date": "2023-01-31T00:00:00Z",
      "volatility": 0.0089,
      "annualizedVolatility": 0.141,
      "observations": 30
    },
    {
      "date": "2023-02-28T00:00:00Z", 
      "volatility": 0.0095,
      "annualizedVolatility": 0.151,
      "observations": 30
    }
  ],
  "summary": {
    "meanVolatility": 0.0092,
    "volatilityOfVolatility": 0.0023,
    "minVolatility": 0.0034,
    "maxVolatility": 0.0187,
    "currentVolatility": 0.0087
  }
}
```

## Data Quality & Validation

### Validate Data Quality
Check risk factor data for outliers and quality issues.

```http
POST /v1/risk-factors/{marketObjectCode}/validate
```

**Request Body:**
```json
{
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-15T00:00:00Z",
  "validationRules": [
    {
      "ruleType": "outlier_detection",
      "parameters": {
        "method": "z_score",
        "threshold": 3.0
      }
    },
    {
      "ruleType": "monotonicity_check",
      "parameters": {
        "allowedDirection": "both"
      }
    },
    {
      "ruleType": "gap_detection",
      "parameters": {
        "maxGapDays": 5
      }
    }
  ]
}
```

**Response:**
```json
{
  "marketObjectCode": "USD_SOFR_3M",
  "validationResults": [
    {
      "ruleType": "outlier_detection", 
      "status": "warning",
      "issues": [
        {
          "date": "2024-01-08T00:00:00Z",
          "value": 0.0612,
          "z_score": 3.2,
          "severity": "medium"
        }
      ]
    },
    {
      "ruleType": "gap_detection",
      "status": "error", 
      "issues": [
        {
          "startDate": "2024-01-06T00:00:00Z",
          "endDate": "2024-01-11T00:00:00Z",
          "gapDays": 6,
          "severity": "high"
        }
      ]
    }
  ],
  "overallQuality": "acceptable",
  "qualityScore": 0.87
}
```

---

The Risk Factor APIs provide comprehensive functionality for managing all market data requirements within the ACTUS Framework, from simple time series management to complex scenario generation and real-time streaming.