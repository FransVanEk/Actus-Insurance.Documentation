# ACTUS Insurance Documentation

A Next.js documentation site for the ACTUS Insurance project, covering the hackathon story, ACTUS standard, GPU background, technical implementation, and insurance extensions.

## Getting Started

Install dependencies (this also installs Puppeteer, used for PDF generation):

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

---

## Generating Section PDFs

Each documentation section defined in `config/sections.json` can be exported as a standalone, print-ready PDF. The script collects all markdown files for a section, renders them with the site's design (navy/amber colour scheme, matching fonts and code styles), and saves one PDF per section to `public/downloads/`. It also updates `config/resources.json` automatically so the PDFs appear in the site's Resources page.

### First-time setup

Puppeteer is already listed in `devDependencies`. Just run:

```bash
npm install
```

Puppeteer will download its bundled version of Chromium (~170 MB) automatically.

### Generate all section PDFs

```bash
npm run generate-pdfs
```

This produces:

| File | Section |
|------|---------|
| `public/downloads/hackathon-documentation.pdf` | The Hackathon Story |
| `public/downloads/actus-org-documentation.pdf` | ACTUS Organization |
| `public/downloads/background-gpu-documentation.pdf` | Background — GPU Computing |
| `public/downloads/technical-documentation.pdf` | Technical Documentation |
| `public/downloads/actus-insurance-documentation.pdf` | ACTUS Insurance Extensions |

`config/resources.json` is updated with a new entry for each PDF.

### Generate a single section

Pass the section `id` (folder name under `docs/`) as the first argument:

```bash
npm run generate-pdfs -- hackathon
npm run generate-pdfs -- actus-org
npm run generate-pdfs -- background-gpu
npm run generate-pdfs -- technical
npm run generate-pdfs -- actus-insurance
```

### Preview the PDF design without Chromium

The `--html-only` flag renders the same HTML template but skips the Puppeteer step and writes `.html` files instead. Open them in any browser to check the design before committing to a full PDF run.

```bash
# All sections
npm run generate-pdfs:preview

# Single section
npm run generate-pdfs -- hackathon --html-only
```

### What each PDF contains

1. **Cover page** — section title, description, and feature highlights on a navy background
2. **Table of contents** — links to every document in the section
3. **All documents** — one page break per document, amber headings, styled tables and code blocks, embedded SVG images
4. **Running header/footer** — section name in the header, page numbers in the footer

### Script location

```
scripts/generate-section-pdfs.js
```

To add a new section, define it in `config/sections.json` and create the corresponding folder under `docs/`. Re-running `npm run generate-pdfs` will pick it up automatically.

---

## Project structure

```
├── app/                  # Next.js App Router pages and API routes
├── components/           # React components (Sidebar, DocumentRenderer, Search…)
├── config/
│   ├── sections.json     # Section definitions (id, title, description, features)
│   ├── resources.json    # Downloadable resources shown on the Resources page
│   └── proper-nouns.json # Capitalisation overrides for ACTUS terminology
├── docs/                 # Markdown documentation source files
│   ├── hackathon/
│   ├── actus-org/
│   ├── background-gpu/
│   ├── technical/
│   └── actus-insurance/
├── lib/                  # Shared utilities (markdown loader, search, sentence case)
├── public/
│   └── downloads/        # Generated PDFs and other downloadable assets
└── scripts/
    └── generate-section-pdfs.js   # PDF generation script
```

---

## Deployment

Build for production:

```bash
npm run build
npm run start
```

Or use the included Dockerfile for a containerised deployment.
