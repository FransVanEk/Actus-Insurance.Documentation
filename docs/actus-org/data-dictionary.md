---
title: Data Dictionary
description: The ACTUS data dictionary — contract attributes, available formats, and the GitHub repository.
category: ACTUS Organization
order: 6
source: https://www.actusfrf.org/dictionary
---

# Data Dictionary

## Overview

The data dictionary provides a collection of all contract attributes as defined by the ACTUS Standard. The Data Standard defines a universal set of legal terms — or CT Attributes — used as parameters throughout the different financial agreements. It is implemented in the form of a Data Dictionary with Attribute Applicability by Contract Type.

Permitted values for each term are listed in the ACTUS data dictionary.

## Available Formats

The dictionary comes in two forms:

- **Excel** — for human readability
- **JSON** — for programmatic integration

The JSON dictionary (`actus-dictionary.json`) is derived from the Excel dictionary (`actus-dictionary.xlsx`) through an R script.

## GitHub Repository

The data dictionary is maintained in the GitHub repository at `actusfrf/actus-dictionary`. The repository contains the ACTUS dictionary and generation scripts.

Files available in the repository include:

- `actus-dictionary.xlsx` — the Excel format dictionary
- `actus-dictionary.json` — the JSON format dictionary
- `actus-dictionary-terms.json` — the dictionary terms in JSON format

## Attribute Applicability

The data dictionary defines which contract attributes apply to which contract types. Business rules in the dictionary specify whether each attribute is mandatory, optional, or non-applicable for a given contract type.
