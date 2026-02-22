---
title: Markdown Features Test
description: Test page demonstrating all supported markdown features and styling
category: Examples
order: 1
---

# Markdown Features Test

This page demonstrates all the markdown features supported in the ACTUS documentation site.

## Headers

### Level 3 Header
#### Level 4 Header
##### Level 5 Header
###### Level 6 Header

## Text Formatting

This is **bold text** and this is *italic text*. You can also use ***bold and italic*** together.

Here's some ~~strikethrough text~~ and some `inline code`.

## Links and References

Visit the [ACTUS website](https://www.actusfrf.org/) for more information.

Internal link to [Core Concepts](core-concepts).

## Lists

### Unordered Lists
- First item
- Second item with a longer description that wraps to multiple lines to test the formatting
  - Nested item
  - Another nested item
- Third item

### Ordered Lists
1. First numbered item
2. Second numbered item
   1. Nested numbered item
   2. Another nested numbered item
3. Third numbered item

### Task Lists
- [x] Completed task
- [ ] Incomplete task
- [x] Another completed task

## Code Examples

### Inline Code
Use the `getAllDocSlugs()` function to retrieve document slugs.

### Code Blocks

#### JavaScript/TypeScript
```javascript
function calculateCashFlow(contract, riskFactors) {
  const events = contract.getEventSchedule();
  const cashFlows = [];
  
  for (const event of events) {
    const cashFlow = {
      date: event.date,
      amount: event.calculateAmount(riskFactors),
      type: event.type
    };
    cashFlows.push(cashFlow);
  }
  
  return cashFlows;
}
```

#### Python
```python
def calculate_expected_credit_loss(pd, lgd, ead):
    """
    Calculate Expected Credit Loss using PD, LGD, and EAD
    
    Args:
        pd: Probability of Default
        lgd: Loss Given Default  
        ead: Exposure at Default
    
    Returns:
        Expected Credit Loss
    """
    return pd * lgd * ead

# Example usage
ecl = calculate_expected_credit_loss(0.02, 0.45, 100000)
print(f"Expected Credit Loss: ${ecl:,.2f}")
```

#### SQL
```sql
SELECT 
    contract_id,
    contract_type,
    notional_principal,
    maturity_date,
    CASE 
        WHEN maturity_date < CURRENT_DATE THEN 'Matured'
        WHEN maturity_date < CURRENT_DATE + INTERVAL '1 year' THEN 'Short Term'
        ELSE 'Long Term'
    END AS maturity_bucket
FROM actus_contracts
WHERE contract_type IN ('ANN', 'PAM', 'LAM')
ORDER BY maturity_date;
```

#### JSON
```json
{
  "contractId": "LOAN_001_2024",
  "contractType": "ANN", 
  "statusDate": "2024-01-15",
  "contractTerms": {
    "notionalPrincipal": 250000.00,
    "nominalInterestRate": 0.045,
    "maturityDate": "2034-01-15",
    "currency": "USD",
    "dayCountConvention": "30E360"
  },
  "riskFactors": {
    "interestRateCurve": "USD_LIBOR",
    "creditSpread": 0.002
  }
}
```

## Tables

### Basic Table
| Contract Type | Description | Use Cases |
|---------------|-------------|-----------|
| PAM | Principal at Maturity | Corporate bonds, Government securities |
| ANN | Annuity | Mortgages, Auto loans |
| LAM | Linear Amortizer | Commercial loans |

### Complex Table
| Metric | Base Case | Stress +200bp | Stress -200bp | Comment |
|--------|-----------|---------------|---------------|---------|
| Portfolio Value | $15.2M | $14.8M | $15.7M | Interest rate sensitivity |
| Duration | 4.2 years | 4.1 years | 4.3 years | Moderate duration risk |
| Convexity | 18.5 | 18.2 | 18.8 | Positive convexity |
| VaR (99%) | $234K | $287K | $198K | Higher risk in up scenario |

## Blockquotes

> This is a blockquote demonstrating important information or citations from regulatory guidance.

> **Basel III Requirements**  
> Banks must maintain a Common Equity Tier 1 (CET1) ratio of at least 4.5% of risk-weighted assets, plus a capital conservation buffer of 2.5%, effectively requiring a minimum CET1 ratio of 7%.

## Mathematical Expressions

The Expected Credit Loss calculation is:
```
ECL = PD × LGD × EAD × DF
```

Where:
- PD = Probability of Default
- LGD = Loss Given Default  
- EAD = Exposure at Default
- DF = Discount Factor

## Horizontal Rules

---

## Images
![ACTUS Logo](https://via.placeholder.com/400x200/3B82F6/FFFFFF?text=ACTUS+Framework)

## Emphasis and Alerts

> **⚠️ Important:** Always validate contract terms before processing cash flows.

> **✅ Best Practice:** Use the latest risk factors for accurate calculations.

> **ℹ️ Note:** This implementation supports all major ACTUS contract types.

## Definition Lists

Term 1
: Definition of the first term with detailed explanation.

Term 2  
: Definition of the second term that may span multiple lines and contain additional details about the concept.

ACTUS
: Algorithmic Contract Types Unified Standards - A standardized framework for representing financial contracts.

## Footnotes

This text has a footnote[^1].

Another reference to a footnote[^note].

[^1]: This is the first footnote.
[^note]: This is a named footnote with more detailed information that might span multiple lines.

---

This test page demonstrates the comprehensive markdown support available in the ACTUS documentation system, ensuring professional presentation of technical content.