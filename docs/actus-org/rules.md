---
title: Rules
description: Business rules for contract attribute applicability — the notation system and how rules define mandatory, optional, and non-applicable attributes.
category: ACTUS Organization
order: 8
source: https://www.actusfrf.org/rules
---

# Rules

## Overview

Business rules define the applicability of contract attributes to the different contract types. Each rule specifies whether a given contract attribute (CA) is non-applicable, mandatory, or optional for a given contract type.

## Rule Notation

A business rule is written in the form `a(b,c,d)`, where each component has the following meaning:

- **Rule `a`** — defines whether a contract attribute is non-applicable, mandatory, or optional for the contract type.
- **Rule `b`** — indicates whether the same applicability rule is subject to a further conditional group rule `c`.
- **Rule `c`** — the conditional group rule referenced by `b`.
- **Rule `d`** — defines an additional applicability rule that may apply in the context of stand-alone or parent-child contract type relationships.

## Applicability Designations

Each contract attribute is assigned one of the following applicability designations for each contract type:

- **Mandatory** — the attribute must be provided for the contract type.
- **Optional** — the attribute may be provided but is not required.
- **Non-applicable** — the attribute does not apply to the contract type and should not be provided.

## Rule `e`

Rule `e` defines additional constraints for array-type contract attributes, specifying the structure and permitted content of attribute arrays.

## Attribute Applicability Matrix

The full attribute applicability matrix is contained in the ACTUS data dictionary, which lists the applicability designation for every combination of contract attribute and contract type.
