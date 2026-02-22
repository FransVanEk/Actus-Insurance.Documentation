---
title: Software Development Kits
description: Official SDKs for building applications with ACTUS APIs
category: Development
parent: framework/dev-tools
order: 2
---

# ACTUS Software Development Kits

Official SDKs provide native language support for building applications with the ACTUS Framework. Each SDK offers comprehensive API coverage, local development tools, and production-ready features.

## Available SDKs

### JavaScript/TypeScript SDK
**Status**: GA (Generally Available)  
**Latest Version**: 2.1.0  
**Node.js**: ≥ 14.x  
**Browser Support**: Modern browsers (ES2018+)

```bash
npm install @actus/javascript-sdk
```

### Java SDK  
**Status**: GA (Generally Available)  
**Latest Version**: 2.0.3  
**Java**: ≥ 11  
**Frameworks**: Spring Boot, Micronaut, Quarkus

```xml
<dependency>
    <groupId>org.actus</groupId>
    <artifactId>actus-java-sdk</artifactId>
    <version>2.0.3</version>
</dependency>
```

### Python SDK
**Status**: GA (Generally Available)  
**Latest Version**: 2.1.1  
**Python**: ≥ 3.8  
**Async Support**: Native asyncio support

```bash
pip install actus-python-sdk
```

### Go SDK
**Status**: Beta  
**Latest Version**: 1.0.0-beta.3  
**Go**: ≥ 1.18  
**Modules**: Full Go modules support

```bash
go get github.com/actusfrf/go-sdk
```

### C# SDK
**Status**: Beta  
**Latest Version**: 1.0.0-beta.2  
**.NET**: ≥ 6.0  
**Frameworks**: .NET Core, .NET Framework

```bash
dotnet add package Actus.DotNet.SDK --version 1.0.0-beta.2
```

## Quick Start Guides

### JavaScript/TypeScript

#### Installation & Setup
```javascript
import { ActusClient } from '@actus/javascript-sdk'

const actus = new ActusClient({
  clientId: process.env.ACTUS_CLIENT_ID,
  clientSecret: process.env.ACTUS_CLIENT_SECRET,
  environment: 'production' // or 'sandbox'
})
```

#### Basic Usage
```javascript
// Create a contract
const contract = await actus.contracts.create({
  contractType: 'PAM',
  contractID: 'BOND_2024_001',
  notionalPrincipal: 1000000,
  nominalInterestRate: 0.035,
  maturityDate: '2027-01-15T00:00:00Z',
  // ... other contract terms
})

// Generate cash flows
const cashFlows = await actus.cashflows.generate({
  contractID: contract.contractID,
  statusDate: '2024-01-15T00:00:00Z'
})

// Calculate present value
const valuation = await actus.valuations.presentValue({
  contractID: contract.contractID,
  discountCurve: 'USD_TREASURY_CURVE'
})

console.log(`Contract PV: ${valuation.presentValue}`)
```

#### TypeScript Support
```typescript
import { ActusClient, ContractType, PAMContract } from '@actus/javascript-sdk'

const pamContract: PAMContract = {
  contractType: ContractType.PAM,
  contractID: 'BOND_2024_001',
  notionalPrincipal: 1000000,
  nominalInterestRate: 0.035,
  // TypeScript ensures type safety
}

const client = new ActusClient({
  clientId: process.env.ACTUS_CLIENT_ID!,
  clientSecret: process.env.ACTUS_CLIENT_SECRET!
})
```

### Java SDK

#### Maven Configuration
```xml
<dependencies>
    <dependency>
        <groupId>org.actus</groupId>
        <artifactId>actus-java-sdk</artifactId>
        <version>2.0.3</version>
    </dependency>
</dependencies>
```

#### Spring Boot Integration
```java
// Configuration
@Configuration
@EnableActus
public class ActusConfig {
    
    @Bean
    public ActusClientProperties actusProperties() {
        ActusClientProperties props = new ActusClientProperties();
        props.setClientId(environment.getProperty("actus.client-id"));
        props.setClientSecret(environment.getProperty("actus.client-secret"));
        props.setBaseUrl("https://api.actus.org");
        return props;
    }
}

// Service Usage
@Service
public class PortfolioService {
    
    @Autowired
    private ActusClient actusClient;
    
    public List<CashFlow> generatePortfolioCashFlows(String portfolioId) {
        CashFlowRequest request = CashFlowRequest.builder()
            .portfolioID(portfolioId)
            .statusDate(LocalDateTime.now())
            .build();
            
        return actusClient.cashFlows().generate(request);
    }
}
```

#### Reactive Programming
```java
// Using Spring WebFlux
@RestController
public class ContractController {
    
    @Autowired
    private ReactiveActusClient reactiveActusClient;
    
    @PostMapping("/contracts/{contractId}/cashflows")
    public Mono<CashFlowResponse> generateCashFlows(
            @PathVariable String contractId,
            @RequestBody CashFlowRequest request) {
        
        return reactiveActusClient.cashFlows()
            .generate(request)
            .map(this::mapToResponse);
    }
}
```

### Python SDK

#### Basic Setup
```python
from actus_sdk import ActusClient
from actus_sdk.models import PAMContract
from datetime import datetime

client = ActusClient(
    client_id="your-client-id",
    client_secret="your-client-secret",
    environment="production"
)
```

#### Contract Management
```python
# Create contract using model classes
contract = PAMContract(
    contract_id="BOND_2024_001",
    notional_principal=1000000,
    nominal_interest_rate=0.035,
    maturity_date=datetime(2027, 1, 15),
    currency="USD"
)

# Create in ACTUS system
result = client.contracts.create(contract)
print(f"Contract created: {result.contract_id}")

# Generate cash flows
cash_flows = client.cash_flows.generate(
    contract_id="BOND_2024_001",
    status_date=datetime(2024, 1, 15)
)

for cf in cash_flows.cash_flows:
    print(f"Date: {cf.event_date}, Amount: {cf.payoff}")
```

#### Async Support
```python
import asyncio
from actus_sdk import AsyncActusClient

async def main():
    async with AsyncActusClient(
        client_id="your-client-id",
        client_secret="your-client-secret"
    ) as client:
        
        # Concurrent operations
        contracts = await client.contracts.search(currency="USD")
        
        # Process multiple contracts concurrently
        tasks = [
            client.cash_flows.generate(contract_id=contract.contract_id)
            for contract in contracts[:10]
        ]
        
        results = await asyncio.gather(*tasks)
        
        for result in results:
            print(f"Generated {len(result.cash_flows)} cash flows")

asyncio.run(main())
```

#### Pandas Integration
```python
import pandas as pd
from actus_sdk.integrations import to_dataframe

# Convert cash flows to DataFrame
cash_flows = client.cash_flows.generate(contract_id="BOND_2024_001")
df = to_dataframe(cash_flows)

# Analyze with pandas
monthly_flows = df.groupby(df['event_date'].dt.to_period('M'))['payoff'].sum()
print(monthly_flows)

# Export to Excel
df.to_excel('cash_flows.xlsx', index=False)
```

### Go SDK

#### Installation & Setup
```go
import (
    "context"
    "log"
    
    "github.com/actusfrf/go-sdk/actus"
    "github.com/actusfrf/go-sdk/models"
)

func main() {
    client := actus.NewClient(&actus.Config{
        ClientID:     os.Getenv("ACTUS_CLIENT_ID"),
        ClientSecret: os.Getenv("ACTUS_CLIENT_SECRET"),
        BaseURL:      "https://api.actus.org",
    })
    
    ctx := context.Background()
    
    // Create contract
    contract := &models.PAMContract{
        ContractID:        "BOND_2024_001",
        NotionalPrincipal: 1000000,
        NominalInterestRate: 0.035,
        MaturityDate:      time.Date(2027, 1, 15, 0, 0, 0, 0, time.UTC),
    }
    
    result, err := client.Contracts.Create(ctx, contract)
    if err != nil {
        log.Fatal(err)
    }
    
    log.Printf("Contract created: %s", result.ContractID)
}
```

#### Concurrent Processing
```go
func processPortfolio(client *actus.Client, contractIDs []string) error {
    ctx := context.Background()
    
    // Create worker pool
    const numWorkers = 10
    jobs := make(chan string, len(contractIDs))
    results := make(chan *models.CashFlowResponse, len(contractIDs))
    
    // Start workers
    for w := 0; w < numWorkers; w++ {
        go func() {
            for contractID := range jobs {
                cashFlows, err := client.CashFlows.Generate(ctx, &models.CashFlowRequest{
                    ContractID: contractID,
                    StatusDate: time.Now(),
                })
                if err != nil {
                    log.Printf("Error generating cash flows for %s: %v", contractID, err)
                    continue
                }
                results <- cashFlows
            }
        }()
    }
    
    // Send jobs
    for _, contractID := range contractIDs {
        jobs <- contractID
    }
    close(jobs)
    
    // Collect results
    for i := 0; i < len(contractIDs); i++ {
        result := <-results
        log.Printf("Generated %d cash flows for contract", len(result.CashFlows))
    }
    
    return nil
}
```

## SDK Features Comparison

| Feature | JavaScript | Java | Python | Go | C# |
|---------|------------|------|--------|----|----| 
| **API Coverage** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | 🚧 Partial |
| **Type Safety** | ✅ TypeScript | ✅ Native | ✅ Type Hints | ✅ Native | ✅ Native |
| **Async Support** | ✅ Promise-based | ✅ Reactive | ✅ asyncio | ✅ Goroutines | ✅ Tasks |
| **Local Validation** | ✅ | ✅ | ✅ | ✅ | 🚧 |
| **Retry Logic** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Circuit Breaker** | ✅ | ✅ | ✅ | ✅ | 🚧 |
| **Caching** | ✅ | ✅ | ✅ | ✅ | 🚧 |
| **Metrics** | ✅ | ✅ | ✅ | ✅ | 🚧 |
| **Testing Utils** | ✅ | ✅ | ✅ | ✅ | 🚧 |

## Advanced Features

### Error Handling
All SDKs provide structured error handling:

```javascript
// JavaScript
try {
  const contract = await actus.contracts.create(contractData)
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.details)
  } else if (error instanceof RateLimitError) {
    console.error('Rate limited, retry after:', error.retryAfter)
  }
}
```

### Retry & Circuit Breaker
```java
// Java - Configure retry behavior
ActusClient client = ActusClient.builder()
    .retryConfig(RetryConfig.builder()
        .maxAttempts(3)
        .backoffStrategy(BackoffStrategy.exponential(Duration.ofSeconds(1)))
        .build())
    .circuitBreakerConfig(CircuitBreakerConfig.builder()
        .failureThreshold(5)
        .recoveryTimeout(Duration.ofMinutes(2))
        .build())
    .build();
```

### Local Development
```python
# Python - Mock mode for testing
client = ActusClient(
    client_id="test",
    client_secret="test",
    mock_mode=True  # Uses local mock responses
)

# Create test data
client.testing.create_mock_contract("BOND_001", {
    "contract_type": "PAM",
    "notional_principal": 1000000
})
```

## Best Practices

### Configuration Management
```javascript
// Use environment-specific configuration
const config = {
  development: {
    baseUrl: 'https://api-dev.actus.org',
    timeout: 10000,
    retries: 1
  },
  production: {
    baseUrl: 'https://api.actus.org',
    timeout: 30000,
    retries: 3
  }
}

const client = new ActusClient(config[process.env.NODE_ENV])
```

### Connection Pooling
```java
// Java - Optimize connection management
@Configuration
public class ActusConfiguration {
    
    @Bean
    public ActusClient actusClient() {
        return ActusClient.builder()
            .connectionPool(ConnectionPoolConfig.builder()
                .maxTotalConnections(200)
                .maxConnectionsPerRoute(50)
                .connectionTimeout(Duration.ofSeconds(10))
                .socketTimeout(Duration.ofSeconds(30))
                .build())
            .build();
    }
}
```

### Resource Management
```python
# Python - Use context managers
async with ActusClient() as client:
    # Client automatically handles connection cleanup
    contracts = await client.contracts.search(currency="USD")
    
    # Batch operations are automatically optimized
    results = await client.batch.process([
        client.cash_flows.generate(contract_id=c.contract_id)
        for c in contracts
    ])
```

---

Choose the SDK that best fits your technology stack and development preferences. All SDKs provide the same comprehensive access to ACTUS Framework functionality with language-appropriate idioms and best practices.