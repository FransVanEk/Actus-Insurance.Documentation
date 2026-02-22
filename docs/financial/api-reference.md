---
title: API Reference
description: Complete API reference for ACTUS contract processing and cash flow generation
category: Financial
order: 1
---

# API Reference

This comprehensive API reference covers all endpoints and methods available in the ACTUS implementation for contract processing, cash flow generation, and risk analysis.

## Authentication

All API requests require authentication using either API keys or OAuth 2.0 tokens.

### API Key Authentication
```http
Authorization: Bearer your-api-key-here
Content-Type: application/json
```

### OAuth 2.0 Authentication
```http
Authorization: Bearer your-oauth-token-here
Content-Type: application/json
```

## Base URL
```
https://api.actus.yourcompany.com/v1
```

## Contract Management

### Create Contract
Create a new ACTUS contract in the system.

```http
POST /contracts
```

**Request Body:**
```json
{
  "contractId": "LOAN_001_2024",
  "contractType": "ANN",
  "statusDate": "2024-01-15",
  "contractDealDate": "2024-01-10",
  "initialExchangeDate": "2024-01-15",
  "maturityDate": "2034-01-15",
  "notionalPrincipal": 250000.00,
  "nominalInterestRate": 0.045,
  "currency": "USD",
  "dayCountConvention": "30E360",
  "businessDayConvention": "MF",
  "endOfMonthConvention": "EOM",
  "interestPaymentFrequency": "P3M",
  "principalRedemptionFrequency": "P3M"
}
```

**Response:**
```json
{
  "contractId": "LOAN_001_2024",
  "status": "created",
  "validationResults": {
    "isValid": true,
    "warnings": [],
    "errors": []
  },
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Get Contract
Retrieve a specific contract by ID.

```http
GET /contracts/{contractId}
```

**Response:**
```json
{
  "contractId": "LOAN_001_2024",
  "contractType": "ANN",
  "statusDate": "2024-01-15",
  "contractDealDate": "2024-01-10",
  "initialExchangeDate": "2024-01-15",
  "maturityDate": "2034-01-15",
  "notionalPrincipal": 250000.00,
  "nominalInterestRate": 0.045,
  "currency": "USD",
  "currentStatus": "PF",
  "lastUpdated": "2024-01-15T10:30:00Z"
}
```

### Update Contract
Update an existing contract's terms.

```http
PUT /contracts/{contractId}
```

### Delete Contract
Remove a contract from the system.

```http
DELETE /contracts/{contractId}
```

### List Contracts
Retrieve multiple contracts with filtering options.

```http
GET /contracts?contractType=ANN&currency=USD&limit=100&offset=0
```

**Query Parameters:**
- `contractType`: Filter by contract type
- `currency`: Filter by currency
- `statusDate`: Filter by status date
- `limit`: Number of results to return (default: 50, max: 1000)
- `offset`: Number of results to skip (default: 0)

## Cash Flow Generation

### Generate Cash Flows
Generate cash flows for a specific contract.

```http
POST /contracts/{contractId}/cashflows
```

**Request Body:**
```json
{
  "analysisDate": "2024-01-15",
  "riskFactors": {
    "interestRateCurve": "USD_LIBOR",
    "creditSpread": 0.002,
    "performanceStatus": "PF"
  },
  "scenarios": ["base", "stress_up_200bp"],
  "includeAccruals": true
}
```

**Response:**
```json
{
  "contractId": "LOAN_001_2024",
  "analysisDate": "2024-01-15",
  "scenarios": {
    "base": {
      "cashflows": [
        {
          "eventDate": "2024-04-15",
          "eventType": "IP",
          "currency": "USD",
          "amount": 2812.50,
          "nominalValue": 0,
          "accruedInterest": 2812.50
        },
        {
          "eventDate": "2024-04-15",
          "eventType": "PR",
          "currency": "USD", 
          "amount": 5234.67,
          "nominalValue": 5234.67,
          "accruedInterest": 0
        }
      ],
      "summary": {
        "totalCashflows": 48,
        "totalInterest": 89423.56,
        "totalPrincipal": 250000.00,
        "presentValue": 248756.34
      }
    }
  }
}
```

### Get Cached Cash Flows
Retrieve previously calculated cash flows.

```http
GET /contracts/{contractId}/cashflows?analysisDate=2024-01-15&scenario=base
```

## Risk Factor Management

### Upload Risk Factors
Upload new risk factor data.

```http
POST /riskfactors
```

**Request Body:**
```json
{
  "baseDate": "2024-01-15",
  "riskFactors": [
    {
      "marketObjectCode": "USD_LIBOR",
      "riskFactorType": "InterestRate",
      "tenor": "3M",
      "value": 0.0325,
      "referenceDate": "2024-01-15"
    },
    {
      "marketObjectCode": "USD_EUR",
      "riskFactorType": "FXRate",
      "value": 1.0876,
      "referenceDate": "2024-01-15"
    }
  ]
}
```

### Get Risk Factors
Retrieve risk factor values for a specific date and market object.

```http
GET /riskfactors?marketObjectCode=USD_LIBOR&referenceDate=2024-01-15
```

## Portfolio Analysis

### Portfolio Cash Flows
Generate cash flows for an entire portfolio.

```http
POST /portfolios/{portfolioId}/cashflows
```

**Request Body:**
```json
{
  "analysisDate": "2024-01-15",
  "scenarios": ["base", "stress_ir_up_200bp", "stress_ir_down_200bp"],
  "aggregationLevel": "monthly",
  "includePastCashflows": false,
  "riskFactorSet": "latest"
}
```

### Portfolio Risk Metrics
Calculate risk metrics for a portfolio.

```http
POST /portfolios/{portfolioId}/risk-metrics
```

**Response:**
```json
{
  "portfolioId": "PORTFOLIO_001",
  "analysisDate": "2024-01-15",
  "metrics": {
    "totalNotional": 15750000.00,
    "weightedAverageLife": 4.2,
    "modifiedDuration": 3.8,
    "convexity": 18.5,
    "presentValue": 15234567.89,
    "var99": 234567.89,
    "expectedShortfall99": 456789.01
  },
  "breakdown": {
    "byContractType": {
      "ANN": 8500000.00,
      "PAM": 4250000.00,
      "LAM": 3000000.00
    },
    "byCurrency": {
      "USD": 12000000.00,
      "EUR": 2250000.00,
      "GBP": 1500000.00
    }
  }
}
```

## Regulatory Reporting

### Generate Basel III Report
Generate Basel III capital adequacy report.

```http
POST /reports/basel-iii
```

**Request Body:**
```json
{
  "reportingDate": "2024-03-31",
  "portfolioIds": ["PORTFOLIO_001", "PORTFOLIO_002"],
  "riskWeightMethod": "standardized",
  "includeDetails": true
}
```

### Generate IFRS 9 Report
Generate IFRS 9 expected credit loss report.

```http
POST /reports/ifrs-9
```

### Generate Stress Test Report
Generate regulatory stress test report.

```http
POST /reports/stress-test
```

## Validation

### Validate Contract Terms
Validate contract terms against ACTUS specifications.

```http
POST /validation/contract-terms
```

**Request Body:**
```json
{
  "contractType": "ANN",
  "contractTerms": {
    "notionalPrincipal": 250000.00,
    "nominalInterestRate": 0.045,
    "maturityDate": "2034-01-15",
    "interestPaymentFrequency": "P3M"
  }
}
```

**Response:**
```json
{
  "isValid": true,
  "validationResults": {
    "errors": [],
    "warnings": [
      {
        "field": "nominalInterestRate",
        "message": "Interest rate is below market average",
        "severity": "LOW"
      }
    ],
    "info": [
      {
        "message": "Contract term validation completed successfully"
      }
    ]
  }
}
```

## Error Handling

All API endpoints use standard HTTP status codes:

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation errors
- `500 Internal Server Error`: Server error

**Error Response Format:**
```json
{
  "error": {
    "code": "INVALID_CONTRACT_TERMS",
    "message": "Contract terms validation failed",
    "details": [
      {
        "field": "maturityDate",
        "error": "Maturity date must be after initial exchange date"
      }
    ],
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123456789"
  }
}
```

## Rate Limits

API rate limits vary by subscription tier:

- **Free**: 100 requests per hour
- **Professional**: 1,000 requests per hour
- **Enterprise**: 10,000 requests per hour

Rate limit headers are included in all responses:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642248000
```

## SDKs and Libraries

Official SDKs are available for:
- **Python**: `pip install actus-sdk`
- **Java**: Maven dependency `com.actus:actus-java-sdk`
- **C#**: NuGet package `ACTUS.NET.SDK`
- **JavaScript**: `npm install @actus/sdk`

## Support

For API support and technical questions:
- **Documentation**: https://docs.actus.yourcompany.com
- **Support Portal**: https://support.actus.yourcompany.com
- **Email**: api-support@yourcompany.com

---

This API reference provides comprehensive coverage of all ACTUS endpoints. For additional examples and use cases, refer to the implementation guides and SDK documentation.