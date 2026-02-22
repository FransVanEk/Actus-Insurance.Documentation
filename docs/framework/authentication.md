---
title: Authentication & Authorization
description: Complete guide to authentication, authorization, and security for ACTUS APIs
category: APIs
parent: framework/api-guide
order: 2
---

# Authentication & Authorization

The ACTUS Framework implements enterprise-grade security with multiple authentication methods and fine-grained authorization controls suitable for financial institutions.

## Authentication Methods

### OAuth 2.0 (Recommended)
OAuth 2.0 is the primary authentication method for production environments.

#### Client Credentials Flow
For server-to-server authentication:

**1. Register Application**
```bash
curl -X POST https://auth.actus.org/oauth/clients \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "My Banking App",
    "grant_types": ["client_credentials"],
    "scope": "contracts:read contracts:write cashflows:read",
    "redirect_uris": []
  }'
```

**Response:**
```json
{
  "client_id": "banking_app_12345",
  "client_secret": "secret_abc123xyz789",
  "client_name": "My Banking App",
  "grant_types": ["client_credentials"],
  "scope": "contracts:read contracts:write cashflows:read"
}
```

**2. Obtain Access Token**
```bash
curl -X POST https://auth.actus.org/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=banking_app_12345&client_secret=secret_abc123xyz789&scope=contracts:read contracts:write"
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "contracts:read contracts:write"
}
```

**3. Use Token in API Calls**
```bash
curl -X GET https://api.actus.org/v1/contracts \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Authorization Code Flow
For web applications with user interaction:

**1. Authorization Request**
```
https://auth.actus.org/oauth/authorize?
  response_type=code&
  client_id=web_app_67890&
  redirect_uri=https://myapp.com/callback&
  scope=contracts:read profile&
  state=random_state_string
```

**2. Authorization Response**
```
https://myapp.com/callback?
  code=auth_code_xyz123&
  state=random_state_string
```

**3. Token Exchange**
```bash
curl -X POST https://auth.actus.org/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&code=auth_code_xyz123&client_id=web_app_67890&client_secret=web_secret_456&redirect_uri=https://myapp.com/callback"
```

### API Keys
For development and testing environments:

**Generate API Key:**
```bash
curl -X POST https://api.actus.org/v1/auth/api-keys \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Development Key",
    "scopes": ["contracts:read", "cashflows:read"],
    "expires_at": "2024-12-31T23:59:59Z"
  }'
```

**Use API Key:**
```bash
curl -X GET https://api.actus.org/v1/contracts \
  -H "X-API-Key: ak_dev_abc123xyz789"
```

### JWT Token Structure
ACTUS JWT tokens contain the following claims:

```json
{
  "iss": "https://auth.actus.org",
  "sub": "user_12345",
  "aud": "https://api.actus.org",
  "exp": 1640995200,
  "iat": 1640991600,
  "scope": "contracts:read contracts:write cashflows:read",
  "client_id": "banking_app_12345",
  "user_roles": ["analyst", "risk_manager"],
  "tenant_id": "bank_abc_corp",
  "permissions": {
    "contracts": ["read", "write", "delete"],
    "portfolios": ["manage"],
    "reports": ["generate"]
  }
}
```

## Authorization & Permissions

### Scope-based Authorization
API access is controlled through OAuth 2.0 scopes:

| Scope | Description | Endpoints |
|-------|-------------|-----------|
| `contracts:read` | Read contract data | `GET /contracts/*` |
| `contracts:write` | Create/update contracts | `POST,PUT /contracts/*` |
| `contracts:delete` | Delete contracts | `DELETE /contracts/*` |
| `cashflows:read` | Read cash flow data | `GET /cashflows/*` |
| `cashflows:generate` | Generate cash flows | `POST /cashflows/generate` |
| `riskfactors:read` | Read risk factors | `GET /risk-factors/*` |
| `riskfactors:write` | Update risk factors | `POST,PUT /risk-factors/*` |
| `admin:manage` | Administrative functions | `GET,POST /admin/*` |
| `reports:read` | Access reports | `GET /reports/*` |
| `reports:generate` | Generate reports | `POST /reports/generate` |

### Role-based Access Control (RBAC)
Users are assigned roles that determine their permissions:

#### Predefined Roles

**Analyst Role:**
```json
{
  "role": "analyst",
  "description": "Read-only access to contracts and cash flows",
  "scopes": [
    "contracts:read",
    "cashflows:read", 
    "riskfactors:read",
    "reports:read"
  ],
  "restrictions": {
    "portfolios": ["portfolio_123", "portfolio_456"],
    "contract_types": ["PAM", "LAM", "ANN"]
  }
}
```

**Risk Manager Role:**
```json
{
  "role": "risk_manager", 
  "description": "Full access to risk management functions",
  "scopes": [
    "contracts:read",
    "contracts:write",
    "cashflows:read",
    "cashflows:generate",
    "riskfactors:read",
    "riskfactors:write",
    "reports:read",
    "reports:generate"
  ],
  "restrictions": {
    "max_portfolio_size": 1000000
  }
}
```

**System Administrator Role:**
```json
{
  "role": "admin",
  "description": "Full system access including administrative functions", 
  "scopes": ["*"],
  "restrictions": {}
}
```

### Multi-tenant Authorization
ACTUS supports multi-tenant deployments with tenant isolation:

**Tenant-based Token:**
```json
{
  "sub": "user_12345",
  "tenant_id": "bank_abc_corp",
  "tenant_permissions": {
    "contracts": {
      "allowed_types": ["PAM", "LAM", "ANN"],
      "max_notional": 10000000
    },
    "portfolios": {
      "max_size": 100000,
      "allowed_currencies": ["USD", "EUR", "GBP"]
    }
  }
}
```

## Security Headers

### Required Headers
All API requests must include security headers:

```http
Authorization: Bearer <token>
X-Request-ID: unique-request-identifier
X-Client-Version: 1.2.3
User-Agent: MyApp/1.0.0
```

### Security Response Headers
API responses include security headers:

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
X-Rate-Limit-Remaining: 450
X-Rate-Limit-Reset: 1640995200
```

## Token Management

### Token Refresh
Access tokens have limited lifetimes and must be refreshed:

```bash
curl -X POST https://auth.actus.org/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token&refresh_token=rt_abc123xyz789&client_id=banking_app_12345&client_secret=secret_abc123xyz789"
```

### Token Revocation
Revoke tokens when no longer needed:

```bash
curl -X POST https://auth.actus.org/oauth/revoke \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...&client_id=banking_app_12345&client_secret=secret_abc123xyz789"
```

### Token Introspection
Validate and inspect token details:

```bash
curl -X POST https://auth.actus.org/oauth/introspect \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...&client_id=banking_app_12345&client_secret=secret_abc123xyz789"
```

**Response:**
```json
{
  "active": true,
  "scope": "contracts:read contracts:write",
  "client_id": "banking_app_12345",
  "exp": 1640995200,
  "sub": "user_12345",
  "tenant_id": "bank_abc_corp"
}
```

## Security Best Practices

### Token Storage
- **Never store tokens in client-side code** for web applications
- **Use secure storage** mechanisms (KeyChain on iOS, Keystore on Android)
- **Encrypt tokens at rest** in server applications
- **Use environment variables** for client credentials

### Token Transmission
- **Always use HTTPS** for token transmission
- **Include tokens in Authorization header** (never in URL parameters)
- **Implement certificate pinning** for mobile applications
- **Use secure proxy configurations** for corporate networks

### Error Handling
- **Don't expose sensitive information** in error messages
- **Log security events** for monitoring and compliance
- **Implement proper retry logic** for transient failures
- **Handle token expiration gracefully**

### Code Examples

#### Java/Spring Boot
```java
@Component
public class ActusApiClient {
    
    @Value("${actus.api.client-id}")
    private String clientId;
    
    @Value("${actus.api.client-secret}")
    private String clientSecret;
    
    private String accessToken;
    private Instant tokenExpiry;
    
    public String getAccessToken() {
        if (accessToken == null || Instant.now().isAfter(tokenExpiry)) {
            refreshToken();
        }
        return accessToken;
    }
    
    private void refreshToken() {
        RestTemplate restTemplate = new RestTemplate();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "client_credentials");
        body.add("client_id", clientId);
        body.add("client_secret", clientSecret);
        body.add("scope", "contracts:read contracts:write");
        
        HttpEntity<MultiValueMap<String, String>> request = 
            new HttpEntity<>(body, headers);
            
        TokenResponse response = restTemplate.postForObject(
            "https://auth.actus.org/oauth/token", 
            request, 
            TokenResponse.class
        );
        
        this.accessToken = response.getAccessToken();
        this.tokenExpiry = Instant.now().plusSeconds(response.getExpiresIn() - 60);
    }
}
```

#### Python
```python
import requests
import jwt
from datetime import datetime, timedelta

class ActusAuth:
    def __init__(self, client_id, client_secret):
        self.client_id = client_id
        self.client_secret = client_secret
        self.access_token = None
        self.token_expiry = None
    
    def get_access_token(self):
        if not self.access_token or datetime.now() > self.token_expiry:
            self._refresh_token()
        return self.access_token
    
    def _refresh_token(self):
        response = requests.post(
            'https://auth.actus.org/oauth/token',
            data={
                'grant_type': 'client_credentials',
                'client_id': self.client_id,
                'client_secret': self.client_secret,
                'scope': 'contracts:read contracts:write'
            },
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        
        response.raise_for_status()
        token_data = response.json()
        
        self.access_token = token_data['access_token']
        self.token_expiry = datetime.now() + timedelta(
            seconds=token_data['expires_in'] - 60
        )
    
    def make_authenticated_request(self, method, url, **kwargs):
        headers = kwargs.get('headers', {})
        headers['Authorization'] = f'Bearer {self.get_access_token()}'
        kwargs['headers'] = headers
        
        return requests.request(method, url, **kwargs)
```

---

This authentication system ensures enterprise-grade security while maintaining ease of integration for development teams.