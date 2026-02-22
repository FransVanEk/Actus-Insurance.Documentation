---
title: Contract Management APIs
description: Complete reference for contract lifecycle management APIs including creation, validation, and state transitions
category: APIs
parent: framework/api-guide
order: 3
---

# Contract Management APIs

The Contract Management APIs provide comprehensive functionality for managing financial contracts throughout their lifecycle, from creation to maturity.

## Contract Types Supported

### Principal at Maturity (PAM)
Zero-coupon bonds and similar instruments where principal is repaid at maturity.

### Linear Amortizer (LAM) 
Loans with constant principal repayment amounts.

### Negative Amortizer (NAM)
Loans where payments are less than interest, increasing principal balance.

### Annuity (ANN)
Loans with constant payment amounts over the term.

### Stock (STK)
Equity instruments with dividend payments.

### Call Money (CLM)
Overnight deposits and similar short-term instruments.

## Base Contract Endpoints

### Create Contract
Creates a new financial contract with validation.

```http
POST /v1/contracts
```

**Request Body:**
```json
{
  "contractType": "PAM",
  "contractID": "BOND_2024_001",
  "statusDate": "2024-01-15T00:00:00Z",
  "contractRole": "RPA",
  "marketObjectCodeOfRateReset": "USD_LIBOR_3M",
  "nominalInterestRate": 0.035,
  "dayCountConvention": "ACT_360",
  "currency": "USD",
  "initialExchangeDate": "2024-02-01T00:00:00Z",
  "maturityDate": "2027-02-01T00:00:00Z",
  "notionalPrincipal": 1000000.0,
  "premiumDiscount": 0.0,
  "scheduleConfig": {
    "cycleAnchorDateOfInterestPayment": "2024-02-01T00:00:00Z",
    "cycleOfInterestPayment": "P3M",
    "businessDayConvention": "SCF",
    "calendar": "NYC"
  }
}
```

**Response:**
```json
{
  "contractID": "BOND_2024_001",
  "status": "created",
  "validationResults": {
    "isValid": true,
    "warnings": [],
    "errors": []
  },
  "href": "/v1/contracts/BOND_2024_001",
  "createdAt": "2024-01-15T10:30:00Z",
  "version": 1
}
```

### Get Contract
Retrieves a specific contract by ID.

```http
GET /v1/contracts/{contractID}
```

**Parameters:**
- `contractID` (path, required): Unique contract identifier

**Response:**
```json
{
  "contractID": "BOND_2024_001",
  "contractType": "PAM",
  "statusDate": "2024-01-15T00:00:00Z",
  "contractRole": "RPA",
  "marketObjectCodeOfRateReset": "USD_LIBOR_3M",
  "nominalInterestRate": 0.035,
  "dayCountConvention": "ACT_360",
  "currency": "USD",
  "initialExchangeDate": "2024-02-01T00:00:00Z",
  "maturityDate": "2027-02-01T00:00:00Z",
  "notionalPrincipal": 1000000.0,
  "contractStatus": "PF",
  "metadata": {
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "version": 1,
    "createdBy": "user_12345"
  }
}
```

### Update Contract
Updates an existing contract with validation.

```http
PUT /v1/contracts/{contractID}
```

**Request Body:**
```json
{
  "nominalInterestRate": 0.04,
  "marketObjectCodeOfRateReset": "USD_SOFR_3M",
  "version": 1
}
```

**Response:**
```json
{
  "contractID": "BOND_2024_001",
  "status": "updated",
  "validationResults": {
    "isValid": true,
    "warnings": [
      "Interest rate changed from 3.5% to 4.0%"
    ],
    "errors": []
  },
  "version": 2,
  "updatedAt": "2024-01-15T14:22:00Z"
}
```

### Delete Contract
Removes a contract from the system.

```http
DELETE /v1/contracts/{contractID}
```

**Response:**
```json
{
  "contractID": "BOND_2024_001",
  "status": "deleted",
  "deletedAt": "2024-01-15T15:45:00Z"
}
```

## Contract Validation

### Validate Contract
Validates contract terms without saving.

```http
POST /v1/contracts/validate
```

**Request Body:** Same as contract creation

**Response:**
```json
{
  "isValid": false,
  "errors": [
    {
      "field": "maturityDate",
      "code": "INVALID_DATE_SEQUENCE",
      "message": "Maturity date must be after initial exchange date",
      "severity": "error"
    }
  ],
  "warnings": [
    {
      "field": "nominalInterestRate",
      "code": "HIGH_INTEREST_RATE",
      "message": "Interest rate of 15% is unusually high",
      "severity": "warning"
    }
  ],
  "validationRules": [
    "Date sequence validation",
    "Rate bounds checking",
    "Currency compatibility",
    "Schedule consistency"
  ]
}
```

### Contract State Validation
Validates contract state at a specific point in time.

```http
POST /v1/contracts/{contractID}/validate-state
```

**Request Body:**
```json
{
  "statusDate": "2025-06-01T00:00:00Z",
  "riskFactors": {
    "USD_SOFR_3M": 0.045,
    "USD_FX_EUR": 0.85
  }
}
```

## Bulk Operations

### Bulk Create Contracts
Creates multiple contracts in a single transaction.

```http
POST /v1/contracts/bulk
```

**Request Body:**
```json
{
  "contracts": [
    {
      "contractID": "LOAN_2024_001",
      "contractType": "LAM",
      // ... contract terms ...
    },
    {
      "contractID": "LOAN_2024_002", 
      "contractType": "ANN",
      // ... contract terms ...
    }
  ],
  "validationMode": "strict"
}
```

**Response:**
```json
{
  "totalContracts": 2,
  "successful": 1,
  "failed": 1,
  "results": [
    {
      "contractID": "LOAN_2024_001",
      "status": "created",
      "version": 1
    },
    {
      "contractID": "LOAN_2024_002",
      "status": "failed",
      "errors": [
        {
          "code": "MISSING_REQUIRED_FIELD",
          "message": "notionalPrincipal is required"
        }
      ]
    }
  ]
}
```

### Bulk Update Contracts
Updates multiple contracts based on criteria.

```http
PUT /v1/contracts/bulk
```

**Request Body:**
```json
{
  "query": {
    "contractType": "PAM",
    "currency": "USD",
    "maturityDate": {
      "gte": "2024-01-01T00:00:00Z",
      "lte": "2024-12-31T23:59:59Z"
    }
  },
  "updates": {
    "marketObjectCodeOfRateReset": "USD_SOFR_3M"
  }
}
```

## Contract Search & Filtering

### Search Contracts
Advanced search with filtering and sorting.

```http
GET /v1/contracts/search
```

**Query Parameters:**
- `contractType` (string): Filter by contract type
- `currency` (string): Filter by currency
- `statusDate` (string): Status date for filtering
- `maturityDate.gte` (string): Minimum maturity date
- `maturityDate.lte` (string): Maximum maturity date
- `notionalPrincipal.min` (number): Minimum notional amount
- `notionalPrincipal.max` (number): Maximum notional amount
- `sort` (string): Sorting criteria (`createdAt`, `maturityDate`, `notionalPrincipal`)
- `order` (string): Sort order (`asc` or `desc`)
- `limit` (number): Maximum results per page (default: 100)
- `offset` (number): Pagination offset

**Example Request:**
```http
GET /v1/contracts/search?contractType=PAM&currency=USD&notionalPrincipal.min=100000&sort=maturityDate&order=asc&limit=50
```

**Response:**
```json
{
  "contracts": [
    {
      "contractID": "BOND_2024_001",
      "contractType": "PAM",
      "currency": "USD",
      "notionalPrincipal": 1000000,
      "maturityDate": "2027-02-01T00:00:00Z",
      "href": "/v1/contracts/BOND_2024_001"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 50,
    "offset": 0,
    "hasNext": false,
    "hasPrevious": false
  },
  "metadata": {
    "query": {
      "contractType": "PAM",
      "currency": "USD",
      "notionalPrincipal.min": 100000
    },
    "executionTime": "45ms"
  }
}
```

## Contract Events & History

### Get Contract Events
Retrieves the event history for a contract.

```http
GET /v1/contracts/{contractID}/events
```

**Response:**
```json
{
  "contractID": "BOND_2024_001",
  "events": [
    {
      "eventType": "IED",
      "eventTime": "2024-02-01T00:00:00Z",
      "payoff": -1000000.0,
      "currency": "USD",
      "eventID": "evt_001"
    },
    {
      "eventType": "IP",
      "eventTime": "2024-05-01T00:00:00Z", 
      "payoff": 8750.0,
      "currency": "USD",
      "eventID": "evt_002"
    }
  ],
  "totalEvents": 2
}
```

### Get Contract State
Retrieves contract state at a specific date.

```http
GET /v1/contracts/{contractID}/state
```

**Query Parameters:**
- `statusDate` (string, required): ISO 8601 date for state calculation

**Response:**
```json
{
  "contractID": "BOND_2024_001",
  "statusDate": "2025-06-01T00:00:00Z",
  "contractState": {
    "notionalPrincipal": 1000000.0,
    "nominalInterestRate": 0.035,
    "accruedInterest": 2916.67,
    "statusDate": "2025-06-01T00:00:00Z",
    "maturityDate": "2027-02-01T00:00:00Z",
    "nextEventDate": "2025-08-01T00:00:00Z",
    "nextEventType": "IP"
  }
}
```

## Portfolio Management

### Create Portfolio
Groups contracts for batch operations.

```http
POST /v1/portfolios
```

**Request Body:**
```json
{
  "portfolioID": "PORTFOLIO_2024_Q1",
  "name": "Q1 2024 Bond Portfolio",
  "description": "Government and corporate bonds acquired in Q1 2024",
  "contractIDs": [
    "BOND_2024_001",
    "BOND_2024_002", 
    "BOND_2024_003"
  ],
  "metadata": {
    "riskProfile": "conservative",
    "targetDuration": 3.5,
    "sector": "government"
  }
}
```

### Add Contracts to Portfolio
```http
POST /v1/portfolios/{portfolioID}/contracts
```

**Request Body:**
```json
{
  "contractIDs": [
    "BOND_2024_004",
    "BOND_2024_005"
  ]
}
```

## Contract Templates

### Create Contract Template
Define reusable contract templates.

```http
POST /v1/contract-templates
```

**Request Body:**
```json
{
  "templateID": "PAM_GOVERNMENT_BOND",
  "name": "Government Bond Template",
  "contractType": "PAM",
  "defaultTerms": {
    "contractRole": "RPA",
    "dayCountConvention": "ACT_360",
    "currency": "USD",
    "businessDayConvention": "SCF",
    "calendar": "NYC"
  },
  "requiredFields": [
    "contractID",
    "notionalPrincipal", 
    "nominalInterestRate",
    "initialExchangeDate",
    "maturityDate"
  ],
  "validation": {
    "nominalInterestRate": {
      "min": 0,
      "max": 0.15
    },
    "notionalPrincipal": {
      "min": 1000
    }
  }
}
```

### Create Contract from Template
```http
POST /v1/contracts/from-template
```

**Request Body:**
```json
{
  "templateID": "PAM_GOVERNMENT_BOND",
  "contractID": "BOND_2024_006",
  "parameters": {
    "notionalPrincipal": 500000,
    "nominalInterestRate": 0.028,
    "initialExchangeDate": "2024-03-01T00:00:00Z",
    "maturityDate": "2029-03-01T00:00:00Z"
  }
}
```

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `CONTRACT_NOT_FOUND` | Contract ID does not exist | 404 |
| `INVALID_CONTRACT_TYPE` | Unknown contract type | 400 |
| `VALIDATION_FAILED` | Contract validation errors | 422 |
| `DUPLICATE_CONTRACT_ID` | Contract ID already exists | 409 |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions | 403 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `INVALID_DATE_FORMAT` | Date format is incorrect | 400 |
| `MISSING_REQUIRED_FIELD` | Required field not provided | 400 |
| `VALUE_OUT_OF_RANGE` | Numeric value exceeds bounds | 400 |
| `CURRENCY_NOT_SUPPORTED` | Currency code not recognized | 400 |

## Rate Limiting

Contract Management APIs enforce the following rate limits:

- **Read operations**: 1000 requests per minute per client
- **Write operations**: 100 requests per minute per client  
- **Bulk operations**: 10 requests per minute per client
- **Validation operations**: 500 requests per minute per client

Rate limit headers are included in responses:
```http
X-Rate-Limit-Limit: 1000
X-Rate-Limit-Remaining: 842
X-Rate-Limit-Reset: 1640995200
X-Rate-Limit-Window: 60
```

---

The Contract Management APIs provide comprehensive functionality for handling all aspects of financial contract lifecycle management within the ACTUS Framework.