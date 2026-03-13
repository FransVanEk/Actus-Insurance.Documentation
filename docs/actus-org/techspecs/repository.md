---
title: Repository
description: The actusfrf/actus-techspecs GitHub repository — file structure, build instructions, license, version, and how to contribute.
category: ACTUS Organization — Technical Specifications
order: 6
source: https://github.com/actusfrf/actus-techspecs
---

# Repository

## Location

The ACTUS Technical Specifications repository is hosted on GitHub at:

`https://github.com/actusfrf/actus-techspecs`

## Files

The repository contains the following files:

| File | Description |
|------|-------------|
| `actus-techspecs.tex` | The main LaTeX source file containing the complete technical specification |
| `actus-techspecs.pdf` | The compiled PDF version of the specification |
| `bibliography.bib` | Bibliography references for the specification document |
| `build.sh` | Shell script to compile the LaTeX source into a PDF |
| `README.md` | Repository overview, build instructions, and license information |
| `CONTRIBUTING.md` | Guidelines for contributing to the specification |
| `LICENSE.md` | The full text of the Creative Commons CC-BY-SA 4.0 license |
| `VERSION.md` | Current version information |
| `.gitignore` | Standard Git ignore configuration |

## Version

The current release of the specification is **Version 1.1**, released on **June 8, 2020**.

## License

The ACTUS Technical Specification Document is freely available and licensed under the **Creative Commons Attribution Share-Alike (CC-BY-SA) version 4.0** license.

## Accessing the PDF

The latest compiled PDF is generally available at:

`https://www.actusfrf.org/algorithmic-standard`

## Building from Source

The specification can be built as a PDF from the LaTeX source. Clone the repository and run the build script:

```bash
git clone https://github.com/actusfrf/actus-techspecs.git
cd actus-techspecs
./build.sh
```

Running `build.sh` creates the necessary configuration files and compiles the LaTeX source into a PDF version of the ACTUS Technical Specifications Document. Standard `pdflatex` tools are used for compilation.

## Contributing

Contribution guidelines are described in `CONTRIBUTING.md` in the repository. The specification is maintained by the ACTUS Users Association. Issues and pull requests can be submitted through the GitHub repository.

## Relationship to Other Repositories

The techspecs repository is part of the broader `actusfrf` GitHub organization, which also includes:

- `actusfrf/actus-dictionary` — the ACTUS Data Dictionary
- `actusfrf/actus-core` — the Java reference implementation
- `actusfrf/actus-core-license` — the ACTUS Core License
- `actusfrf/actus-webapp` — the ACTUS Demo App
