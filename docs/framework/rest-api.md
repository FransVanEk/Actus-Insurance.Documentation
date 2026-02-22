---
title: REST API Reference
description: Complete REST API documentation for ACTUS framework integration
category: APIs
order: 6
---

# REST API Reference

The ACTUS Framework provides comprehensive RESTful APIs for contract management, cash flow generation, and risk analysis. All APIs follow OpenAPI 3.0 specifications.

## Base Configuration

### Base URL
```
Production: https://api.actus.org/v1
Staging: https://staging-api.actus.org/v1
Development: http://localhost:8080/api/v1
```

### Authentication
All API endpoints require authentication using Bearer tokens:

```http
Authorization: Bearer <your-access-token>
Content-Type: application/json
```

### Rate Limiting
- **Standard Plan**: 1,000 requests per hour
- **Professional Plan**: 10,000 requests per hour  
- **Enterprise Plan**: Unlimited requests

## Contract Management APIs

### Create Contract
Create a new ACTUS contract in the system.

**Endpoint:** `POST /contracts`

**Request Body:**
```json
{
  "contractType": "PAM",
  "contractId": "LOAN001",
  "statusDate": "2024-01-01T00:00:00Z",
  "contractRole": "RPA",
  "contractTerms": {
    "calendar": "NOCALENDAR",
    "businessDayConvention": "NOS", 
    "endOfMonthConvention": "EOM",
    "initialExchangeDate": "2024-01-15T00:00:00Z",
    "maturityDate": "2029-01-15T00:00:00Z",
    "notionalPrincipal": 1000000,
    "nominalInterestRate": 0.05,
    "dayCountConvention": "A365",
    "cycleAnchorDateOfInterestPayment": "2024-01-15T00:00:00Z",
    "cycleOfInterestPayment": "P3M"
  }
}
```

**Response (201 Created):**
```json
{
  "contractId": "LOAN001",
  "status": "active",
  "createdAt": "2024-01-01T10:30:00Z",
  "version": 1,
  "links": {
    "self": "/contracts/LOAN001",
    "cashflows": "/contracts/LOAN001/cashflows",
    "events": "/contracts/LOAN001/events"
  }
}
```

### Get Contract
Retrieve contract details by ID.

**Endpoint:** `GET /contracts/{contractId}`

**Response (200 OK):**
```json
{
  "contractId": "LOAN001",
  "contractType": "PAM",
  "status": "active",
  "contractRole": "RPA",
  "contractTerms": {
    "initialExchangeDate": "2024-01-15T00:00:00Z",
    "maturityDate": "2029-01-15T00:00:00Z",
    "notionalPrincipal": 1000000,
    "nominalInterestRate": 0.05,
    "currentPrincipal": 950000
  },
  "createdAt": "2024-01-01T10:30:00Z",
  "updatedAt": "2024-01-15T09:00:00Z",
  "version": 2
}
```

### Update Contract
Update existing contract terms.

**Endpoint:** `PUT /contracts/{contractId}`

**Request Body:**
```json
{
  "contractTerms": {
    "nominalInterestRate": 0.045,
    "effectiveDate": "2024-06-01T00:00:00Z"
  },
  "reason": "Rate adjustment per amendment"
}
```

**Response (200 OK):**
```json
{
  "contractId": "LOAN001",
  "status": "active",
  "version": 3,
  "updatedAt": "2024-06-01T08:30:00Z",
  "changeLog": {
    "previousRate": 0.05,
    "newRate": 0.045,
    "effectiveDate": "2024-06-01T00:00:00Z"
  }
}
```

## Cash Flow APIs

### Generate Cash Flows
Generate cash flows for a contract or portfolio.

**Endpoint:** `POST /cashflows/generate`

**Request Body:**
```json
{
  "contracts": ["LOAN001", "LOAN002"],
  "analysisDate": "2024-01-01T00:00:00Z",
  "horizon": "P5Y",
  "riskFactors": {
    "interestRateScenario": "base",
    "creditSpreadScenario": "stressed"
  }
}
```

**Response (200 OK):**
```json
{
  "analysisId": "analysis-20240101-001",
  "generatedAt": "2024-01-01T11:45:00Z",
  "cashFlows": [
    {
      "contractId": "LOAN001",
      "flows": [
        {
          "date": "2024-04-15T00:00:00Z",
          "type": "INTEREST",
          "amount": 12500.00,
          "currency": "USD",
          "discountedValue": 12350.25
        },
        {
          "date": "2024-07-15T00:00:00Z", 
          "type": "INTEREST",
          "amount": 12500.00,
          "currency": "USD",
          "discountedValue": 12125.50
        }
      ]
    }
  ],
  "summary": {
    "totalContracts": 2,
    "totalCashFlows": 120,
    "presentValue": 984532.75,
    "duration": 3.2
  }
}
```

### Get Cash Flows
Retrieve previously generated cash flows.

**Endpoint:** `GET /cashflows/{analysisId}`

**Query Parameters:**
- `contractId` (optional): Filter by specific contract
- `type` (optional): Filter by cash flow type (INTEREST, PRINCIPAL, FEE)
- `fromDate` (optional): Start date filter
- `toDate` (optional): End date filter

## Risk Factor APIs

### Update Risk Factors
Update market risk factors for calculations.

**Endpoint:** `POST /risk-factors`

**Request Body:**
```json
{
  "effectiveDate": "2024-01-01T00:00:00Z",
  "factors": {
    "interestRates": {
      "USD_3M_LIBOR": 0.0475,
      "USD_10Y_TREASURY": 0.042,
      "USD_PRIME": 0.0525
    },
    "creditSpreads": {
      "CORPORATE_AAA": 0.0085,
      "CORPORATE_BBB": 0.0245
    },
    "foreignExchange": {
      "EUR_USD": 1.0875,
      "GBP_USD": 1.2650
    }
  }
}
```

**Response (200 OK):**
```json
{
  "updateId": "rf-update-20240101-001",
  "effectiveDate": "2024-01-01T00:00:00Z",
  "processedFactors": 7,
  "status": "completed",
  "impactSummary": {
    "affectedContracts": 1250,
    "recalculationRequired": true
  }
}
```

## Event Processing APIs

### Process Contract Events
Process lifecycle events for contracts.

**Endpoint:** `POST /events/process`

**Request Body:**
```json
{
  "events": [
    {
      "contractId": "LOAN001",
      "eventType": "PRINCIPAL_PAYMENT",
      "eventDate": "2024-01-15T00:00:00Z",
      "amount": 50000,
      "currency": "USD"
    },
    {
      "contractId": "LOAN001", 
      "eventType": "RATE_RESET",
      "eventDate": "2024-01-15T00:00:00Z",
      "newRate": 0.048,
      "effectiveDate": "2024-02-01T00:00:00Z"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "batchId": "batch-20240115-001",
  "processedEvents": 2,
  "results": [
    {
      "contractId": "LOAN001",
      "eventType": "PRINCIPAL_PAYMENT", 
      "status": "processed",
      "newPrincipalBalance": 950000
    },
    {
      "contractId": "LOAN001",
      "eventType": "RATE_RESET",
      "status": "scheduled",
      "effectiveDate": "2024-02-01T00:00:00Z"
    }
  ]
}
```

## Error Handling

### Error Response Format
All API errors follow a consistent format:

```json
{
  "error": {
    "code": "INVALID_CONTRACT_TERMS",
    "message": "The specified contract terms are invalid",
    "details": [
      {
        "field": "nominalInterestRate",
        "issue": "Rate cannot exceed 1.0 (100%)",
        "value": 1.25
      }
    ],
    "requestId": "req-20240101-12345",
    "timestamp": "2024-01-01T10:30:00Z"
  }
}
```

### Common Error Codes
| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or expired access token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Contract or resource not found |
| `INVALID_CONTRACT_TERMS` | 400 | Contract validation failed |
| `RATE_LIMITED` | 429 | API rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Server error |

## SDK and Client Libraries

### JavaScript/TypeScript
```bash
npm install @actus/client-js
```

```javascript
import { ActusClient } from '@actus/client-js';

const client = new ActusClient({
  baseUrl: 'https://api.actus.org/v1',
  apiKey: 'your-api-key'
});

const contract = await client.contracts.create({
  contractType: 'PAM',
  contractId: 'LOAN001',
  // ... contract terms
});
```

### Python
```bash
pip install actus-python-client
```

```python
from actus_client import ActusClient

client = ActusClient(
    base_url='https://api.actus.org/v1',
    api_key='your-api-key'
)

contract = client.contracts.create(
    contract_type='PAM',
    contract_id='LOAN001',
    # ... contract terms
)
```

---

For complete API documentation, interactive examples, and testing tools, visit our [API Console](https://api.actus.org/console).