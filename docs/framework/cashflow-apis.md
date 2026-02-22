---
title: Cash Flow APIs
description: Comprehensive reference for cash flow generation, analysis, and scenario modeling APIs
category: APIs
parent: framework/api-guide
order: 4
---

# Cash Flow APIs

The Cash Flow APIs enable generation, analysis, and modeling of cash flows for individual contracts and portfolios under various scenarios and risk factor assumptions.

## Overview

Cash flow generation is a core function of the ACTUS Framework, transforming contract terms into time-series of monetary amounts. The APIs support:

- **Deterministic cash flows** based on known contract terms
- **Scenario-based modeling** with risk factor shocks
- **Portfolio aggregation** across multiple contracts
- **Present value calculations** with discount curves
- **Sensitivity analysis** for risk management

## Basic Cash Flow Generation

### Generate Contract Cash Flows
Generates the complete cash flow schedule for a contract.

```http
POST /v1/cashflows/generate
```

**Request Body:**
```json
{
  "contractID": "BOND_2024_001",
  "statusDate": "2024-01-15T00:00:00Z",
  "observationDate": "2024-01-15T00:00:00Z", 
  "riskFactorScenario": "base",
  "riskFactors": {
    "USD_LIBOR_3M": [
      {
        "date": "2024-01-15T00:00:00Z",
        "value": 0.035
      },
      {
        "date": "2024-02-15T00:00:00Z", 
        "value": 0.036
      }
    ],
    "USD_FX_EUR": [
      {
        "date": "2024-01-15T00:00:00Z",
        "value": 0.85
      }
    ]
  }
}
```

**Response:**
```json
{
  "contractID": "BOND_2024_001",
  "statusDate": "2024-01-15T00:00:00Z",
  "currency": "USD",
  "cashFlows": [
    {
      "eventType": "IED",
      "eventDate": "2024-02-01T00:00:00Z",
      "payoff": -1000000.0,
      "currency": "USD",
      "eventID": "cf_001",
      "nominalValue": -1000000.0,
      "accruedInterest": 0.0
    },
    {
      "eventType": "IP",
      "eventDate": "2024-05-01T00:00:00Z",
      "payoff": 8750.0,
      "currency": "USD", 
      "eventID": "cf_002",
      "nominalValue": -1000000.0,
      "accruedInterest": 8750.0
    },
    {
      "eventType": "PR",
      "eventDate": "2027-02-01T00:00:00Z", 
      "payoff": 1000000.0,
      "currency": "USD",
      "eventID": "cf_003",
      "nominalValue": 0.0,
      "accruedInterest": 0.0
    }
  ],
  "summary": {
    "totalEvents": 3,
    "totalInflow": 1008750.0,
    "totalOutflow": -1000000.0,
    "netCashFlow": 8750.0,
    "firstEventDate": "2024-02-01T00:00:00Z",
    "lastEventDate": "2027-02-01T00:00:00Z"
  },
  "generationMetadata": {
    "generatedAt": "2024-01-15T10:30:45Z",
    "executionTime": "125ms",
    "riskFactorScenario": "base"
  }
}
```

### Generate Portfolio Cash Flows
Aggregates cash flows across multiple contracts.

```http
POST /v1/cashflows/portfolio/generate
```

**Request Body:**
```json
{
  "portfolioID": "PORTFOLIO_2024_Q1",
  "contractIDs": [
    "BOND_2024_001",
    "BOND_2024_002", 
    "LOAN_2024_001"
  ],
  "statusDate": "2024-01-15T00:00:00Z",
  "aggregationLevel": "portfolio",
  "riskFactors": {
    "USD_LIBOR_3M": [
      {
        "date": "2024-01-15T00:00:00Z",
        "value": 0.035
      }
    ]
  }
}
```

**Response:**
```json
{
  "portfolioID": "PORTFOLIO_2024_Q1",
  "statusDate": "2024-01-15T00:00:00Z",
  "currency": "USD",
  "aggregatedCashFlows": [
    {
      "eventDate": "2024-02-01T00:00:00Z",
      "netPayoff": -2500000.0,  
      "inflow": 0.0,
      "outflow": -2500000.0,
      "contractCount": 3
    },
    {
      "eventDate": "2024-03-01T00:00:00Z",
      "netPayoff": 25000.0,
      "inflow": 25000.0,
      "outflow": 0.0,
      "contractCount": 2
    }
  ],
  "contractDetails": [
    {
      "contractID": "BOND_2024_001",
      "contribution": {
        "totalInflow": 1008750.0,
        "totalOutflow": -1000000.0,
        "netCashFlow": 8750.0
      }
    }
  ],
  "portfolioSummary": {
    "totalContracts": 3,
    "totalInflow": 2537500.0,
    "totalOutflow": -2500000.0,
    "netPortfolioCashFlow": 37500.0,
    "currencies": ["USD"],
    "firstEventDate": "2024-02-01T00:00:00Z",
    "lastEventDate": "2027-02-01T00:00:00Z"
  }
}
```

## Scenario Analysis

### Multi-Scenario Cash Flow Generation
Generates cash flows under multiple risk factor scenarios.

```http
POST /v1/cashflows/scenarios/generate
```

**Request Body:**
```json
{
  "contractID": "BOND_2024_001",
  "statusDate": "2024-01-15T00:00:00Z",
  "scenarios": [
    {
      "scenarioID": "base_case",
      "name": "Base Case",
      "probability": 0.6,
      "riskFactors": {
        "USD_LIBOR_3M": [
          {
            "date": "2024-01-15T00:00:00Z",
            "value": 0.035
          },
          {
            "date": "2025-01-15T00:00:00Z",
            "value": 0.04
          }
        ]
      }
    },
    {
      "scenarioID": "stress_up",
      "name": "Interest Rates +200bp",
      "probability": 0.2,
      "riskFactors": {
        "USD_LIBOR_3M": [
          {
            "date": "2024-01-15T00:00:00Z", 
            "value": 0.055
          },
          {
            "date": "2025-01-15T00:00:00Z",
            "value": 0.06 
          }
        ]
      }
    },
    {
      "scenarioID": "stress_down",
      "name": "Interest Rates -100bp",
      "probability": 0.2,
      "riskFactors": {
        "USD_LIBOR_3M": [
          {
            "date": "2024-01-15T00:00:00Z",
            "value": 0.025
          },
          {
            "date": "2025-01-15T00:00:00Z", 
            "value": 0.03
          }
        ]
      }
    }
  ]
}
```

**Response:**
```json
{
  "contractID": "BOND_2024_001",
  "statusDate": "2024-01-15T00:00:00Z",
  "scenarioResults": [
    {
      "scenarioID": "base_case",
      "name": "Base Case",
      "probability": 0.6,
      "netCashFlow": 8750.0,
      "totalInflow": 1008750.0,
      "totalOutflow": -1000000.0,
      "eventCount": 3
    },
    {
      "scenarioID": "stress_up", 
      "name": "Interest Rates +200bp",
      "probability": 0.2,
      "netCashFlow": 13500.0,
      "totalInflow": 1013500.0,
      "totalOutflow": -1000000.0,
      "eventCount": 3
    },
    {
      "scenarioID": "stress_down",
      "name": "Interest Rates -100bp", 
      "probability": 0.2,
      "netCashFlow": 6250.0,
      "totalInflow": 1006250.0,
      "totalOutflow": -1000000.0,
      "eventCount": 3
    }
  ],
  "scenarioStatistics": {
    "expectedNetCashFlow": 9025.0,
    "volatilityNetCashFlow": 2847.2,
    "probabilityWeightedMean": 9025.0,
    "worstCase": {
      "scenarioID": "stress_down",
      "netCashFlow": 6250.0
    },
    "bestCase": {
      "scenarioID": "stress_up", 
      "netCashFlow": 13500.0
    }
  }
}
```

## Present Value Calculations

### Calculate Present Value
Computes present value of cash flows using discount curves.

```http
POST /v1/cashflows/present-value
```

**Request Body:**
```json
{
  "contractID": "BOND_2024_001",
  "statusDate": "2024-01-15T00:00:00Z",
  "discountCurve": "USD_TREASURY_CURVE",
  "discountRates": [
    {
      "date": "2024-01-15T00:00:00Z",
      "tenor": "3M",
      "rate": 0.032
    },
    {
      "date": "2024-01-15T00:00:00Z", 
      "tenor": "1Y",
      "rate": 0.034
    },
    {
      "date": "2024-01-15T00:00:00Z",
      "tenor": "3Y", 
      "rate": 0.038
    }
  ],
  "includeAccruedInterest": true
}
```

**Response:**
```json
{
  "contractID": "BOND_2024_001",
  "statusDate": "2024-01-15T00:00:00Z",
  "presentValue": 982347.56,
  "accruedInterest": 2916.67,
  "cleanPrice": 979430.89,
  "dirtyPrice": 982347.56,
  "yieldToMaturity": 0.0376,
  "modifiedDuration": 2.83,
  "convexity": 8.52,
  "cashFlowBreakdown": [
    {
      "eventDate": "2024-05-01T00:00:00Z",
      "cashFlow": 8750.0,
      "discountFactor": 0.9912,
      "presentValue": 8673.0
    },
    {
      "eventDate": "2024-08-01T00:00:00Z",
      "cashFlow": 8750.0, 
      "discountFactor": 0.9756,
      "presentValue": 8536.5
    },
    {
      "eventDate": "2027-02-01T00:00:00Z",
      "cashFlow": 1008750.0,
      "discountFactor": 0.9654,
      "presentValue": 973724.13
    }
  ],
  "riskMetrics": {
    "dv01": 2834.7,
    "duration": 2.83,
    "convexity": 8.52,
    "effectiveDuration": 2.81
  }
}
```

### Portfolio Present Value
Calculates present value for entire portfolio.

```http
POST /v1/cashflows/portfolio/present-value
```

**Request Body:**
```json
{
  "portfolioID": "PORTFOLIO_2024_Q1",
  "statusDate": "2024-01-15T00:00:00Z",
  "discountCurveSet": {
    "USD": "USD_TREASURY_CURVE",
    "EUR": "EUR_GOVERNMENT_CURVE" 
  },
  "correlationMatrix": [
    [1.0, 0.75],
    [0.75, 1.0]
  ],
  "includeCorrelationEffects": true
}
```

## Sensitivity Analysis

### Interest Rate Sensitivity
Analyzes cash flow sensitivity to interest rate changes.

```http
POST /v1/cashflows/sensitivity/rates
```

**Request Body:**
```json
{
  "contractID": "BOND_2024_001",
  "statusDate": "2024-01-15T00:00:00Z",
  "baseRates": {
    "USD_LIBOR_3M": 0.035
  },
  "shockScenarios": [
    {
      "shockType": "parallel_shift",
      "shockSize": 0.01,
      "currency": "USD"
    },
    {
      "shockType": "parallel_shift", 
      "shockSize": -0.01,
      "currency": "USD"
    },
    {
      "shockType": "steepening",
      "shortEndShock": 0.005,
      "longEndShock": 0.015,
      "currency": "USD"
    }
  ]
}
```

**Response:**
```json
{
  "contractID": "BOND_2024_001",
  "baseCaseValue": 982347.56,
  "sensitivityResults": [
    {
      "shockType": "parallel_shift",
      "shockSize": 0.01,
      "newValue": 955234.78,
      "valueDelta": -27112.78,
      "percentChange": -2.76,
      "duration": 2.83
    },
    {
      "shockType": "parallel_shift",
      "shockSize": -0.01, 
      "newValue": 1011847.92,
      "valueDelta": 29500.36,
      "percentChange": 3.00,
      "duration": 2.83
    },
    {
      "shockType": "steepening",
      "newValue": 968934.12,
      "valueDelta": -13413.44,
      "percentChange": -1.37,
      "keyRateShocks": [
        {"tenor": "3M", "shock": 0.005},
        {"tenor": "1Y", "shock": 0.01}, 
        {"tenor": "3Y", "shock": 0.015}
      ]
    }
  ],
  "riskMetrics": {
    "dv01": 2756.3,
    "convexity": 8.52,
    "keyRateDuration": [
      {"tenor": "3M", "duration": 0.25},
      {"tenor": "1Y", "duration": 0.95},
      {"tenor": "3Y", "duration": 1.63}
    ]
  }
}
```

## Historical Analysis

### Historical Cash Flow Performance  
Analyzes how cash flows would have performed under historical conditions.

```http
POST /v1/cashflows/historical/analysis
```

**Request Body:**
```json
{
  "contractID": "BOND_2024_001",
  "analysisStartDate": "2020-01-01T00:00:00Z",
  "analysisEndDate": "2023-12-31T23:59:59Z",
  "historicalRiskFactors": "USD_LIBOR_3M_HISTORICAL",
  "revaluationFrequency": "monthly"
}
```

**Response:**
```json
{
  "contractID": "BOND_2024_001", 
  "analysisResults": [
    {
      "date": "2020-01-31T00:00:00Z",
      "presentValue": 1024567.89,
      "yieldToMaturity": 0.0285,
      "duration": 3.12
    },
    {
      "date": "2020-02-29T00:00:00Z", 
      "presentValue": 998234.56,
      "yieldToMaturity": 0.0325,
      "duration": 3.08
    }
  ],
  "performanceStatistics": {
    "meanPresentValue": 985432.1,
    "volatility": 0.0247,
    "maxDrawdown": -0.0523,
    "sharpeRatio": 0.87,
    "correlations": {
      "USD_LIBOR_3M": -0.92,
      "S&P_500": 0.15
    }
  }
}
```

## Cash Flow Streaming

### Real-time Cash Flow Updates
Subscribe to real-time cash flow updates as market conditions change.

```http
GET /v1/cashflows/stream/{contractID}
```

**WebSocket Connection:**
```javascript
const ws = new WebSocket('wss://api.actus.org/v1/cashflows/stream/BOND_2024_001?token=<access_token>');

ws.onmessage = function(event) {
  const update = JSON.parse(event.data);
};
```

**WebSocket Message Format:**
```json
{
  "eventType": "cash_flow_update",
  "contractID": "BOND_2024_001", 
  "timestamp": "2024-01-15T14:30:00Z",
  "trigger": "rate_change",
  "updatedCashFlows": [
    {
      "eventDate": "2024-05-01T00:00:00Z",
      "oldPayoff": 8750.0,
      "newPayoff": 8925.0,
      "change": 175.0,
      "changePercent": 2.0
    }
  ],
  "riskFactorChanges": {
    "USD_LIBOR_3M": {
      "oldValue": 0.035,
      "newValue": 0.036,
      "change": 0.001
    }
  }
}
```

## Export & Reporting

### Export Cash Flows
Export cash flows in various formats.

```http
GET /v1/cashflows/{contractID}/export
```

**Query Parameters:**
- `format` (string): Export format (`json`, `csv`, `excel`, `pdf`)
- `statusDate` (string): Status date for cash flow generation
- `includeMetadata` (boolean): Include generation metadata

**CSV Export Response (format=csv):**
```csv
Event Date,Event Type,Payoff,Currency,Nominal Value,Accrued Interest
2024-02-01T00:00:00Z,IED,-1000000.0,USD,-1000000.0,0.0
2024-05-01T00:00:00Z,IP,8750.0,USD,-1000000.0,8750.0
2024-08-01T00:00:00Z,IP,8750.0,USD,-1000000.0,8750.0
2027-02-01T00:00:00Z,PR,1000000.0,USD,0.0,0.0
```

## Error Handling

### Common Error Responses

**Validation Error (422):**
```json
{
  "error": "validation_failed",
  "message": "Cash flow generation validation failed",
  "details": [
    {
      "field": "riskFactors.USD_LIBOR_3M",
      "code": "MISSING_RATE_PATH",
      "message": "Risk factor path missing rates for contract term"
    }
  ]
}
```

**Contract Not Found (404):**
```json
{
  "error": "contract_not_found",
  "message": "Contract BOND_2024_999 does not exist", 
  "contractID": "BOND_2024_999"
}
```

**Computation Error (500):**
```json
{
  "error": "computation_failed",
  "message": "Cash flow computation failed due to numerical instability",
  "details": {
    "contractID": "BOND_2024_001",
    "failurePoint": "interest_payment_calculation",
    "suggestedAction": "Check rate reset dates and conventions"
  }
}
```

---

The Cash Flow APIs provide comprehensive functionality for all cash flow generation, analysis, and risk assessment needs within the ACTUS Framework.