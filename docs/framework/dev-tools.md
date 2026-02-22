---
title: Development Tools
description: Tools and utilities for ACTUS development workflows
category: Development
order: 1
---

# Development Tools

The ACTUS Framework provides a comprehensive suite of development tools to streamline your workflow when building financial applications.

## Overview

Our development tools are designed to help developers:

- **Build Faster**: Pre-built components and templates
- **Debug Easier**: Advanced debugging and testing tools  
- **Deploy Confidently**: CI/CD integration and monitoring
- **Scale Effectively**: Performance optimization utilities

## Tool Categories

### Command Line Interface (CLI)
The ACTUS CLI provides command-line access to all framework functionality, enabling automation and scripting workflows.

### Software Development Kits (SDKs)  
Official SDKs for popular programming languages with comprehensive API coverage and local development support.

### Testing Framework
Specialized testing tools for financial contract validation, cash flow verification, and regression testing.

### Monitoring & Analytics
Real-time monitoring dashboards and performance analytics for production deployments.

## Getting Started

1. **Install the CLI**: `npm install -g @actus/cli`
2. **Choose your SDK**: Select from Java, Python, JavaScript, or Go SDKs
3. **Set up Testing**: Configure automated testing for your contracts
4. **Enable Monitoring**: Add observability to your applications

## Quick Examples

### CLI Usage
```bash
# Initialize a new project
actus init my-project --template=banking-app

# Validate contracts
actus validate contracts/*.json

# Generate cash flows
actus cashflows generate --contract=bond-001 --scenario=base
```

### SDK Integration
```javascript
import { ActusSDK } from '@actus/javascript-sdk'

const actus = new ActusSDK({
  clientId: process.env.ACTUS_CLIENT_ID,
  clientSecret: process.env.ACTUS_CLIENT_SECRET
})

// Contract lifecycle in a few lines
const contract = await actus.contracts.create(contractTerms)
const cashFlows = await actus.cashflows.generate(contract.id)
const presentValue = await actus.valuation.calculatePV(cashFlows)
```

## Development Workflow Integration

### CI/CD Integration
All tools integrate seamlessly with popular CI/CD platforms:
- **GitHub Actions**: Pre-built workflows for contract validation
- **Jenkins**: Pipeline plugins for automated testing
- **Azure DevOps**: Extensions for financial model deployment

### IDE Support
Enhanced development experience with:
- **VS Code Extension**: Syntax highlighting for contract definitions
- **IntelliJ Plugin**: Advanced debugging for Java applications  
- **Vim Plugin**: Command-line-first development workflow

---

Explore the individual tool sections to learn about specific capabilities and integration patterns.