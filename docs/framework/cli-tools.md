---
title: Command Line Interface
description: ACTUS CLI for automation and scripting workflows
category: Development
parent: framework/dev-tools
order: 1
---

# ACTUS Command Line Interface

The ACTUS CLI is a powerful command-line tool that provides direct access to all ACTUS Framework functionality, enabling automation, scripting, and integration into development workflows.

## Installation

### npm (Recommended)
```bash
npm install -g @actus/cli
```

### Homebrew (macOS)
```bash
brew install actus-cli
```

### Direct Download
```bash
# Download latest release
curl -L https://github.com/actusfrf/cli/releases/latest/download/actus-cli-linux -o actus
chmod +x actus
sudo mv actus /usr/local/bin/
```

## Configuration

### Initial Setup
```bash
# Configure API credentials
actus config set client-id YOUR_CLIENT_ID
actus config set client-secret YOUR_CLIENT_SECRET
actus config set api-url https://api.actus.org

# Verify configuration
actus config list
```

### Environment Variables
```bash
export ACTUS_CLIENT_ID="your-client-id"
export ACTUS_CLIENT_SECRET="your-client-secret" 
export ACTUS_API_URL="https://api.actus.org"
```

## Core Commands

### Project Management

#### Initialize New Project
```bash
# Create new project with template
actus init banking-portfolio --template=portfolio-management

# Initialize in existing directory
actus init . --template=bond-analytics

# List available templates
actus templates list
```

#### Project Configuration
```bash
# Generate configuration file
actus config generate --output=actus.config.json

# Validate project structure
actus project validate

# Show project info
actus project info
```

### Contract Operations

#### Create Contracts
```bash
# Create single contract from file
actus contracts create --file=bond.json

# Bulk create from directory
actus contracts create --directory=contracts/ --format=json

# Create from template
actus contracts create --template=government-bond --params="notional=1000000,rate=0.03"
```

#### Validate Contracts
```bash
# Validate single contract
actus contracts validate --file=bond.json

# Validate all contracts in directory
actus contracts validate --directory=contracts/

# Validate with custom rules
actus contracts validate --file=bond.json --rules=strict-validation.json
```

#### List and Query Contracts
```bash
# List all contracts
actus contracts list

# Filter by type
actus contracts list --type=PAM

# Query with criteria
actus contracts query --currency=USD --maturity-after="2025-01-01"

# Export to file
actus contracts list --output=contracts.csv --format=csv
```

### Cash Flow Generation

#### Generate Cash Flows
```bash
# Single contract cash flows
actus cashflows generate --contract=BOND_001 --status-date="2024-01-15"

# Portfolio cash flows
actus cashflows generate --portfolio=PORTFOLIO_Q1 --status-date="2024-01-15"

# With risk scenario
actus cashflows generate --contract=BOND_001 --scenario=stress-test-2024
```

#### Scenario Analysis
```bash
# Multiple scenario analysis
actus cashflows scenarios --contract=BOND_001 --scenarios="base,stress-up,stress-down"

# Monte Carlo simulation
actus cashflows monte-carlo --contract=BOND_001 --simulations=10000

# Export results
actus cashflows generate --contract=BOND_001 --output=cashflows.xlsx --format=excel
```

### Risk Factor Management

#### Upload Market Data
```bash
# Upload from CSV file
actus risk-factors upload --file=rates.csv --risk-factor=USD_SOFR_3M

# Upload multiple files
actus risk-factors upload --directory=market-data/ --format=csv

# Real-time data sync
actus risk-factors sync --source=bloomberg --risk-factors="USD_SOFR_3M,EUR_EURIBOR_6M"
```

#### Curve Construction
```bash
# Build yield curve
actus curves build --curve=USD_TREASURY --date="2024-01-15" --instruments=instruments.json

# Historical curve analysis
actus curves history --curve=USD_TREASURY --start="2023-01-01" --end="2024-01-15"
```

### Testing and Validation

#### Run Test Suites
```bash
# Run all tests
actus test run

# Run specific test category
actus test run --category=contract-validation

# Run with coverage
actus test run --coverage --output=coverage-report.html
```

#### Regression Testing
```bash
# Create baseline
actus test baseline --name=v1.0-baseline

# Run regression tests
actus test regression --baseline=v1.0-baseline

# Compare results
actus test compare --baseline=v1.0-baseline --current=v1.1-candidate
```

## Advanced Features

### Scripting and Automation

#### Batch Processing
```bash
# Process contracts from spreadsheet
actus batch process --input=portfolio.xlsx --template=batch-processing.yml

# Automated reporting
actus reports generate --template=monthly-report --output-dir=reports/
```

#### Pipeline Integration
```bash
# CI/CD integration
actus pipeline validate --config=.actus-ci.yml

# Export for external tools
actus export --format=json --output=integration-data.json
```

### Plugin System

#### Install Plugins
```bash
# Install from registry
actus plugins install @actus/excel-integration

# Install from file
actus plugins install ./custom-plugin.tar.gz

# List installed plugins
actus plugins list
```

#### Custom Commands
```bash
# Run plugin command
actus excel export --workbook=portfolio.xlsx --sheet="Cash Flows"

# Plugin configuration
actus plugins config @actus/excel-integration --set api-version=v1
```

## Configuration Files

### Project Configuration (actus.config.json)
```json
{
  "project": {
    "name": "Banking Portfolio",
    "version": "1.0.0",
    "type": "portfolio-management"
  },
  "api": {
    "baseUrl": "https://api.actus.org",
    "timeout": 30000
  },
  "defaults": {
    "currency": "USD",
    "dayCountConvention": "ACT_360",
    "businessDayConvention": "ModifiedFollowing"
  },
  "validation": {
    "strict": true,
    "customRules": "./validation-rules.json"
  }
}
```

### CI/CD Configuration (.actus-ci.yml)
```yaml
version: "1.0"
pipeline:
  validate:
    - contracts: "contracts/*.json"
    - rules: "strict"
  test:
    - unit: true
    - integration: true
    - coverage: 80
  deploy:
    - environment: "staging"
    - verify: true
notifications:
  slack:
    webhook: "${SLACK_WEBHOOK_URL}"
    channel: "#actus-deployments"
```

## Output Formats

The CLI supports multiple output formats:
- **JSON**: Structured data for programmatic use
- **CSV**: Spreadsheet-compatible format
- **Excel**: Rich formatting with multiple sheets
- **PDF**: Professional reports
- **XML**: Industry-standard format
- **YAML**: Human-readable configuration format

## Error Handling and Debugging

### Verbose Output
```bash
# Enable verbose logging
actus --verbose contracts validate --file=bond.json

# Debug mode
actus --debug cashflows generate --contract=BOND_001

# Log to file
actus contracts list --log-file=actus.log --log-level=debug
```

### Common Issues

**Authentication Errors**
```bash
# Verify credentials
actus auth test

# Refresh token
actus auth refresh
```

**Validation Failures**
```bash
# Detailed validation output
actus contracts validate --file=bond.json --verbose --show-warnings

# Check specific fields
actus contracts validate --file=bond.json --fields="maturityDate,notionalPrincipal"
```

---

The ACTUS CLI is your gateway to automation and efficient development workflows with the ACTUS Framework.