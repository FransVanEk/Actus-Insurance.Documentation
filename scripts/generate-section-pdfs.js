#!/usr/bin/env node
/**
 * generate-section-pdfs.js
 *
 * Generates one PDF per section defined in config/sections.json.
 * Each PDF collects all markdown documents from docs/{section.id}/,
 * renders them with a design that matches the documentation site,
 * and saves the output to public/downloads/{section.id}-documentation.pdf.
 *
 * Finally it updates config/resources.json with entries for each generated PDF.
 *
 * Usage:
 *   npm run generate-pdfs                     — generate all sections
 *   npm run generate-pdfs -- hackathon        — generate one section by id
 *   npm run generate-pdfs -- --html-only      — output HTML preview files only (no Chrome needed)
 *   npm run generate-pdfs -- hackathon --html-only
 *
 * Requirements: puppeteer  (already in devDependencies — run npm install)
 */

'use strict';

const path    = require('path');
const fs      = require('fs');
const os      = require('os');
const { execSync } = require('child_process');
const matter  = require('gray-matter');

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const ROOT          = path.join(__dirname, '..');
const DOCS_DIR      = path.join(ROOT, 'docs');
const DOWNLOADS_DIR = path.join(ROOT, 'public', 'downloads');
const CONFIG_DIR    = path.join(ROOT, 'config');
const SECTIONS_FILE = path.join(CONFIG_DIR, 'sections.json');
const RESOURCES_FILE= path.join(CONFIG_DIR, 'resources.json');

// ---------------------------------------------------------------------------
// Ensure output directory exists
// ---------------------------------------------------------------------------
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

// ---------------------------------------------------------------------------
// Mermaid path (local, for puppeteer inline injection)
// ---------------------------------------------------------------------------
const MERMAID_JS = path.join(ROOT, 'node_modules', 'mermaid', 'dist', 'mermaid.min.js');

// ---------------------------------------------------------------------------
// Markdown → HTML  (using remark pipeline already in the project)
// ---------------------------------------------------------------------------
async function markdownToHtml(markdown) {
  const { remark }     = await import('remark');
  const remarkGfm      = (await import('remark-gfm')).default;
  const remarkHtml     = (await import('remark-html')).default;

  const result = await remark()
    .use(remarkGfm)
    .use(remarkHtml, { sanitize: false })
    .process(markdown);

  return postProcessMermaid(String(result));
}

// ---------------------------------------------------------------------------
// Convert remark's  <pre><code class="language-mermaid">…</code></pre>
// into  <div class="mermaid-wrap"><pre class="mermaid">…</pre></div>
// Browsers + Puppeteer will render these via mermaid.js;
// WeasyPrint will display them as styled source-code blocks.
// ---------------------------------------------------------------------------
function postProcessMermaid(html) {
  return html.replace(
    /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
    (_, src) => {
      // Decode HTML entities that remark may have encoded
      const decoded = src
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      return `<div class="mermaid-wrap"><pre class="mermaid">${decoded}</pre></div>`;
    }
  );
}

// ---------------------------------------------------------------------------
// Collect all markdown files for a section, sorted by order
// ---------------------------------------------------------------------------
function collectSectionDocs(sectionId) {
  const sectionDir = path.join(DOCS_DIR, sectionId);
  if (!fs.existsSync(sectionDir)) return [];

  const files = [];
  walkDir(sectionDir, files);

  // Parse frontmatter & sort
  const docs = files.map(filePath => {
    const raw       = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(raw);
    const relPath   = path.relative(sectionDir, filePath).replace(/\\/g, '/');
    const depth     = relPath.split('/').length - 1; // 0 = root, 1 = subfolder
    return {
      filePath,
      relPath,
      depth,
      title   : data.title   || inferTitle(content, filePath),
      order   : data.order   ?? 999,
      content,
    };
  });

  // Stable sort: first by depth (root before subfolders), then by order, then by name
  docs.sort((a, b) => {
    if (a.depth !== b.depth) return a.depth - b.depth;
    if (a.order !== b.order) return a.order - b.order;
    return a.relPath.localeCompare(b.relPath);
  });

  return docs;
}

function walkDir(dir, results) {
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat     = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath, results);
    } else if (entry.endsWith('.md')) {
      results.push(fullPath);
    }
  }
}

function inferTitle(content, filePath) {
  const h1 = content.match(/^#\s+(.+?)$/m);
  if (h1) return h1[1].trim().replace(/[*_`]/g, '');
  return path.basename(filePath, '.md');
}

// ---------------------------------------------------------------------------
// Resolve images referenced in markdown to data URIs so they work in the PDF
// ---------------------------------------------------------------------------
function resolveImages(htmlContent, fileDir) {
  // Match src="..." or src='...'
  return htmlContent.replace(/src=["']([^"']+)["']/g, (match, src) => {
    // Skip http/https/data URIs
    if (src.startsWith('http') || src.startsWith('data:')) return match;

    // Resolve relative to the file's directory
    const imgPath = path.resolve(fileDir, src);
    if (!fs.existsSync(imgPath)) return match;

    try {
      const ext  = path.extname(imgPath).toLowerCase().replace('.', '');
      const mime = ext === 'svg' ? 'image/svg+xml'
                 : ext === 'png' ? 'image/png'
                 : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
                 : ext === 'gif' ? 'image/gif'
                 : ext === 'webp' ? 'image/webp'
                 : null;
      if (!mime) return match;

      const data = fs.readFileSync(imgPath);
      const b64  = data.toString('base64');
      return `src="data:${mime};base64,${b64}"`;
    } catch {
      return match;
    }
  });
}

// ---------------------------------------------------------------------------
// Build the full HTML document for a section
// ---------------------------------------------------------------------------
async function buildSectionHtml(section, docs) {
  // Build table of contents
  let tocItems = '';
  docs.forEach((doc, idx) => {
    const indent = doc.depth > 0 ? 'style="padding-left:1.5em;"' : '';
    tocItems += `<li ${indent}><a href="#doc-${idx}">${escHtml(doc.title)}</a></li>\n`;
  });

  // Build document HTML blocks
  let docsHtml = '';
  for (let idx = 0; idx < docs.length; idx++) {
    const doc     = docs[idx];
    let html      = await markdownToHtml(doc.content);
    // Resolve images relative to the markdown file's directory
    html = resolveImages(html, path.dirname(doc.filePath));

    // Promote headings: h1→h2 etc. if the doc's first heading is h1
    // (already captured as the section title), to keep hierarchy sensible
    html = html.replace(/<h1>/gi, '<h2>').replace(/<\/h1>/gi, '</h2>');

    const isFirst    = idx === 0;
    const pageBreak  = isFirst ? '' : '<div class="page-break"></div>';

    docsHtml += `
      ${pageBreak}
      <article id="doc-${idx}" class="doc-section">
        <h1 class="doc-title">${escHtml(doc.title)}</h1>
        ${html}
      </article>
    `;
  }

  const now        = new Date();
  const dateStr    = now.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escHtml(section.title)} — ACTUS Insurance Documentation</title>
  <style>
    /* ── Reset & base ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --navy-dark:  #0D2038;
      --navy:       #1A3550;
      --amber:      #D4891A;
      --amber-light:#F0A83A;
      --text:       #1a202c;
      --text-light: #4a5568;
      --border:     #e2e8f0;
      --code-bg:    #f7f8fa;
    }

    html { font-size: 11pt; }

    body {
      font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
      color: var(--text);
      background: #ffffff;
      line-height: 1.65;
    }

    /* ── @page rules (WeasyPrint + browsers) ── */
    @page {
      size: A4;
      margin: 15mm 15mm 18mm 15mm;
    }

    @page :first {
      margin: 0;
    }

    /* ── Cover page ── */
    .cover {
      width: 100%;
      height: 297mm;
      display: flex;
      flex-direction: column;
      background: var(--navy-dark);
      color: #ffffff;
      padding: 0;
      page-break-after: always;
      break-after: page;
    }

    .cover-top {
      background: var(--navy);
      padding: 2rem 3rem;
      border-bottom: 3px solid var(--amber);
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .cover-logo {
      font-size: 1.6rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--amber);
    }

    .cover-logo span {
      color: #9FB8D0;
      font-weight: 400;
    }

    .cover-body {
      flex: 1;
      padding: 4rem 3rem 3rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .cover-label {
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--amber);
      margin-bottom: 1.5rem;
    }

    .cover-title {
      font-size: 2.8rem;
      font-weight: 700;
      line-height: 1.2;
      color: #ffffff;
      margin-bottom: 1.5rem;
    }

    .cover-desc {
      font-size: 1.1rem;
      color: #9FB8D0;
      max-width: 600px;
      line-height: 1.8;
      margin-bottom: 3rem;
    }

    .cover-features {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      max-width: 600px;
    }

    .cover-features li {
      color: #9FB8D0;
      font-size: 0.95rem;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .cover-features li::before {
      content: "▸";
      color: var(--amber);
      flex-shrink: 0;
      margin-top: 0.05em;
    }

    .cover-footer {
      padding: 2rem 3rem;
      border-top: 1px solid rgba(255,255,255,0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #5A7A9A;
      font-size: 0.8rem;
    }

    /* ── Table of Contents ── */
    .toc-page {
      padding: 3rem;
      page-break-after: always;
    }

    .toc-header {
      border-bottom: 2px solid var(--amber);
      padding-bottom: 0.75rem;
      margin-bottom: 2rem;
    }

    .toc-header h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--navy-dark) !important;
    }

    .toc-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .toc-list li a {
      color: var(--navy);
      text-decoration: none;
      font-size: 0.95rem;
      border-bottom: 1px dotted var(--border);
      display: block;
      padding: 0.35rem 0;
    }

    .toc-list li a:hover { color: var(--amber); }

    /* ── Main content area ── */
    .content {
      padding: 3rem;
    }

    /* ── Section page header strip ── */
    .section-header {
      background: var(--navy-dark);
      color: white;
      padding: 1.5rem 3rem;
      margin: -3rem -3rem 2.5rem -3rem;
      border-bottom: 3px solid var(--amber);
    }

    .section-header .breadcrumb {
      font-size: 0.75rem;
      color: #9FB8D0;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 0.3rem;
    }

    .section-header h1 {
      font-size: 1.6rem;
      font-weight: 700;
      color: #ffffff !important;
    }

    /* ── Document sections ── */
    .doc-section {
      margin-bottom: 2rem;
    }

    .doc-title {
      font-size: 1.75rem !important;
      font-weight: 700;
      color: var(--amber) !important;
      margin-bottom: 1.25rem !important;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border);
    }

    /* ── Typography ── */
    h1, h2, h3, h4, h5, h6 {
      color: var(--amber);
      font-weight: 700;
      line-height: 1.3;
      margin-top: 1.5em;
      margin-bottom: 0.6em;
    }

    h1 { font-size: 1.75rem; }
    h2 { font-size: 1.4rem; border-bottom: 1px solid var(--border); padding-bottom: 0.4rem; }
    h3 { font-size: 1.15rem; color: var(--navy) !important; }
    h4 { font-size: 1rem; color: var(--text-light) !important; font-weight: 600; }

    p {
      margin-bottom: 1em;
      color: var(--text);
    }

    a { color: var(--navy); text-decoration: underline; }

    strong { font-weight: 700; }
    em     { font-style: italic; }

    /* ── Lists ── */
    ul, ol {
      margin: 0.75em 0 0.75em 1.8em;
    }

    li {
      margin-bottom: 0.3em;
      line-height: 1.6;
    }

    /* ── Blockquotes ── */
    blockquote {
      border-left: 4px solid var(--amber);
      background: #fdf6ec;
      margin: 1.5em 0;
      padding: 1em 1.5em;
      color: var(--text-light);
      font-style: italic;
      border-radius: 0 4px 4px 0;
    }

    blockquote p { margin-bottom: 0.5em; }
    blockquote p:last-child { margin-bottom: 0; }

    /* ── Code ── */
    code {
      font-family: "Consolas", "Courier New", monospace;
      font-size: 0.88em;
      background: var(--code-bg);
      color: #c7254e;
      padding: 0.15em 0.4em;
      border-radius: 3px;
      border: 1px solid var(--border);
    }

    pre {
      background: #1e2a3a;
      color: #abb2bf;
      border-radius: 6px;
      padding: 1.25em 1.5em;
      overflow: auto;
      margin: 1.25em 0;
      font-size: 0.85em;
      line-height: 1.6;
      border: 1px solid #2d3748;
    }

    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
      border: none;
      font-size: inherit;
    }

    /* ── Tables ── */
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1.25em 0;
      font-size: 0.9em;
      overflow: hidden;
      border-radius: 6px;
      border: 1px solid var(--border);
    }

    thead {
      background: var(--navy-dark);
      color: #ffffff;
    }

    thead th {
      padding: 0.75em 1em;
      font-weight: 600;
      text-align: left;
      color: #ffffff;
      border-right: 1px solid rgba(255,255,255,0.1);
    }

    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody tr:nth-child(odd)  { background: #ffffff; }

    td {
      padding: 0.65em 1em;
      border-top: 1px solid var(--border);
      border-right: 1px solid var(--border);
      vertical-align: top;
      line-height: 1.5;
    }

    /* ── Images ── */
    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 1.5em auto;
      border-radius: 4px;
    }

    /* ── Horizontal rules ── */
    hr {
      border: none;
      border-top: 1px solid var(--border);
      margin: 2em 0;
    }

    /* ── Page breaks ── */
    .page-break {
      page-break-before: always;
      break-before: page;
    }

    /* ── Mermaid diagrams ── */
    .mermaid-wrap {
      margin: 1.5em 0;
      text-align: center;
    }

    /* Rendered state: SVG replaces the <pre> */
    .mermaid-wrap svg {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 0 auto;
    }

    /* Unrendered / WeasyPrint fallback: show source as a styled block */
    pre.mermaid {
      background: #f0f4f8;
      border: 1px solid var(--border);
      border-left: 4px solid var(--amber);
      border-radius: 4px;
      padding: 1em 1.25em;
      font-family: "Consolas", "Courier New", monospace;
      font-size: 0.82em;
      color: var(--text-light);
      white-space: pre;
      text-align: left;
    }

    /* Label shown above the source in WeasyPrint fallback */
    .mermaid-wrap::before {
      content: "Diagram (rendered interactively in browser)";
      display: block;
      font-size: 0.72em;
      font-weight: 600;
      color: var(--amber);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 0.4em;
      text-align: left;
    }

    /* Hide the label once mermaid has replaced the pre with an svg */
    .mermaid-wrap:has(svg)::before {
      display: none;
    }

    /* ── Print-specific ── */
    @media print {
      .cover     { height: 297mm; page-break-after: always; break-after: page; }
      .toc-page  { page-break-after: always; break-after: page; }
      .page-break { page-break-before: always; break-before: page; }

      pre { white-space: pre-wrap; word-break: break-all; }
      a   { color: inherit; text-decoration: none; }

      .mermaid-wrap svg { page-break-inside: avoid; }
      pre.mermaid { background: #f0f4f8 !important; -webkit-print-color-adjust: exact; }

      thead { background: var(--navy-dark) !important; -webkit-print-color-adjust: exact; }
      .cover { background: var(--navy-dark) !important; -webkit-print-color-adjust: exact; }
      .cover-top { background: var(--navy) !important; -webkit-print-color-adjust: exact; }
      .section-header { background: var(--navy-dark) !important; -webkit-print-color-adjust: exact; }
      blockquote { background: #fdf6ec !important; -webkit-print-color-adjust: exact; }
      pre { background: #1e2a3a !important; -webkit-print-color-adjust: exact; }
    }
  </style>
  <!-- Mermaid: renders diagrams in browsers and Puppeteer; ignored by WeasyPrint -->
  <script type="module">
    try {
      const { default: mermaid } = await import('https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs');
      mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        themeVariables: {
          primaryColor:       '#1A3550',
          primaryTextColor:   '#ffffff',
          primaryBorderColor: '#D4891A',
          lineColor:          '#D4891A',
          secondaryColor:     '#0D2038',
          tertiaryColor:      '#f0f4f8',
          fontFamily:         'Arial, Helvetica, sans-serif',
          fontSize:           '13px',
        },
        flowchart:  { useMaxWidth: true, htmlLabels: true },
        sequence:   { useMaxWidth: true },
        gantt:      { useMaxWidth: true },
      });
      await mermaid.run({ querySelector: '.mermaid' });
    } catch (e) {
      console.warn('Mermaid CDN not available; diagrams shown as source.', e.message);
    }
  </script>
</head>
<body>

  <!-- ═══ COVER PAGE ═══ -->
  <div class="cover">
    <div class="cover-top">
      <div class="cover-logo">ACTUS<span> Insurance Documentation</span></div>
    </div>
    <div class="cover-body">
      <div class="cover-label">Documentation Section</div>
      <h1 class="cover-title">${escHtml(section.title)}</h1>
      <p class="cover-desc">${escHtml(section.description || section.blurb || '')}</p>
      ${section.features && section.features.length ? `
      <ul class="cover-features">
        ${section.features.map(f => `<li>${escHtml(f)}</li>`).join('\n        ')}
      </ul>` : ''}
    </div>
    <div class="cover-footer">
      <span>ACTUS Insurance Documentation</span>
      <span>Generated ${dateStr}</span>
    </div>
  </div>

  <!-- ═══ TABLE OF CONTENTS ═══ -->
  <div class="toc-page">
    <div class="toc-header">
      <h2>Table of Contents</h2>
    </div>
    <ul class="toc-list">
      ${tocItems}
    </ul>
  </div>

  <!-- ═══ DOCUMENT CONTENT ═══ -->
  <div class="content">
    <div class="section-header">
      <div class="breadcrumb">ACTUS Insurance Documentation</div>
      <h1>${escHtml(section.shortTitle || section.title)}</h1>
    </div>

    ${docsHtml}
  </div>

</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Escape HTML special chars
// ---------------------------------------------------------------------------
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------------------------------------------------------------------------
// Generate a single section PDF using Puppeteer
// ---------------------------------------------------------------------------
async function generateSectionPdf(section, puppeteer) {
  console.log(`\n📄 Generating: ${section.title} …`);

  const docs = collectSectionDocs(section.id);
  if (docs.length === 0) {
    console.warn(`  ⚠️  No markdown files found in docs/${section.id}/ — skipping`);
    return null;
  }
  console.log(`  Found ${docs.length} document(s)`);

  const html     = await buildSectionHtml(section, docs);
  const filename = `${section.id}-documentation.pdf`;
  const outPath  = path.join(DOWNLOADS_DIR, filename);

  // Write intermediate HTML for debugging (optional — remove if unwanted)
  // fs.writeFileSync(path.join(DOWNLOADS_DIR, `${section.id}-documentation.html`), html);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Inject mermaid.js from local node_modules (avoids CDN dependency)
    if (fs.existsSync(MERMAID_JS)) {
      await page.addScriptTag({ path: MERMAID_JS });
      await page.evaluate(() => {
        window.mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          themeVariables: {
            primaryColor:       '#1A3550',
            primaryTextColor:   '#ffffff',
            primaryBorderColor: '#D4891A',
            lineColor:          '#D4891A',
            secondaryColor:     '#0D2038',
            tertiaryColor:      '#f0f4f8',
            fontFamily:         'Arial, Helvetica, sans-serif',
            fontSize:           '13px',
          },
          flowchart:  { useMaxWidth: true, htmlLabels: true },
          sequence:   { useMaxWidth: true },
          gantt:      { useMaxWidth: true },
        });
      });
      await page.evaluate(() => window.mermaid.run({ querySelector: '.mermaid' }));
      // Wait until every .mermaid block has been replaced by an SVG (or timeout after 15s)
      await page.waitForFunction(
        () => document.querySelectorAll('pre.mermaid').length === 0 ||
              document.querySelectorAll('.mermaid-wrap svg').length > 0,
        { timeout: 15000 }
      ).catch(() => { /* some diagrams may have failed — continue anyway */ });
      // Extra settle time for complex diagrams
      await new Promise(r => setTimeout(r, 500));
    }

    await page.pdf({
      path:              outPath,
      format:            'A4',
      printBackground:   true,
      margin: {
        top:    '15mm',
        bottom: '18mm',
        left:   '15mm',
        right:  '15mm',
      },
      displayHeaderFooter: true,
      headerTemplate: `<div style="width:100%;font-size:8pt;font-family:Arial,sans-serif;color:#9FB8D0;padding:0 15mm;display:flex;justify-content:space-between;align-items:center;">
        <span style="color:#D4891A;font-weight:600;">ACTUS Insurance Documentation</span>
        <span>${escHtml(section.title)}</span>
      </div>`,
      footerTemplate: `<div style="width:100%;font-size:8pt;font-family:Arial,sans-serif;color:#9FB8D0;padding:0 15mm;display:flex;justify-content:space-between;align-items:center;">
        <span>actus-insurance.documentation</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>`,
    });

    console.log(`  ✅ Saved → public/downloads/${filename}`);
    return { filename, section };
  } finally {
    await browser.close();
  }
}

// ---------------------------------------------------------------------------
// Update resources.json
// ---------------------------------------------------------------------------
function updateResources(generated) {
  const existing  = JSON.parse(fs.readFileSync(RESOURCES_FILE, 'utf8'));

  // Remove any previously generated section PDFs (identified by id prefix)
  const filtered  = existing.filter(r => !r.id.endsWith('-section-pdf'));

  const newEntries = generated
    .filter(Boolean)
    .map(({ filename, section }) => ({
      id:          `${section.id}-section-pdf`,
      title:       `${section.title} — Full Documentation (PDF)`,
      description: section.blurb || section.description || `Complete ${section.title} documentation exported as a printable PDF.`,
      type:        'pdf',
      size:        getSizeLabel(path.join(DOWNLOADS_DIR, filename)),
      url:         `/downloads/${filename}`,
      viewUrl:     `/downloads/${filename}`,
      generated:   new Date().toISOString(),
      section:     section.id,
    }));

  const updated = [...filtered, ...newEntries];
  fs.writeFileSync(RESOURCES_FILE, JSON.stringify(updated, null, 2) + '\n', 'utf8');
  console.log(`\n✅ Updated config/resources.json — added ${newEntries.length} PDF resource(s)`);
}

function getSizeLabel(filePath) {
  try {
    const bytes = fs.statSync(filePath).size;
    if (bytes < 1024)        return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  } catch { return ''; }
}

// ---------------------------------------------------------------------------
// Detect available PDF engine
// ---------------------------------------------------------------------------
function detectEngine(requestedEngine) {
  if (requestedEngine === 'puppeteer' || requestedEngine === 'weasyprint') {
    return requestedEngine;
  }
  // Auto-detect: try Puppeteer's bundled Chrome first
  try {
    const puppeteer = require('puppeteer');
    const chromePath = puppeteer.executablePath();
    if (fs.existsSync(chromePath)) return 'puppeteer';
  } catch { /* not installed */ }

  // Fall back to WeasyPrint
  try {
    const candidates = [
      'weasyprint',
      path.join(os.homedir(), '.local', 'bin', 'weasyprint'),
    ];
    for (const cmd of candidates) {
      try { execSync(`"${cmd}" --version`, { stdio: 'ignore' }); return 'weasyprint'; } catch { /* try next */ }
    }
  } catch { /* not found */ }

  return null;
}

function weasyprintPath() {
  const candidates = [
    'weasyprint',
    path.join(os.homedir(), '.local', 'bin', 'weasyprint'),
  ];
  for (const cmd of candidates) {
    try { execSync(`"${cmd}" --version`, { stdio: 'ignore' }); return cmd; } catch { /* next */ }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Generate a single section PDF using WeasyPrint
// ---------------------------------------------------------------------------
async function generateSectionPdfWeasyprint(section) {
  console.log(`\n📄 Generating: ${section.title} (WeasyPrint) …`);

  const docs = collectSectionDocs(section.id);
  if (docs.length === 0) {
    console.warn(`  ⚠️  No markdown files found in docs/${section.id}/ — skipping`);
    return null;
  }
  console.log(`  Found ${docs.length} document(s)`);

  const html     = await buildSectionHtml(section, docs);
  const filename = `${section.id}-documentation.pdf`;
  const outPath  = path.join(DOWNLOADS_DIR, filename);

  // Write HTML to a temp file
  const tmpHtml = path.join(os.tmpdir(), `actus-${section.id}-${Date.now()}.html`);
  fs.writeFileSync(tmpHtml, html, 'utf8');

  try {
    const wp = weasyprintPath();
    execSync(`"${wp}" "${tmpHtml}" "${outPath}"`, { stdio: ['ignore', 'ignore', 'pipe'] });
    console.log(`  ✅ Saved → public/downloads/${filename}`);
    return { filename, section };
  } finally {
    try { fs.unlinkSync(tmpHtml); } catch { /* ignore */ }
  }
}

// ---------------------------------------------------------------------------
// Generate HTML-only preview (no Puppeteer needed)
// ---------------------------------------------------------------------------
async function generateSectionHtmlPreview(section) {
  console.log(`\n🌐 Preview HTML: ${section.title} …`);

  const docs = collectSectionDocs(section.id);
  if (docs.length === 0) {
    console.warn(`  ⚠️  No markdown files found in docs/${section.id}/ — skipping`);
    return null;
  }
  console.log(`  Found ${docs.length} document(s)`);

  const html     = await buildSectionHtml(section, docs);
  const filename = `${section.id}-documentation.html`;
  const outPath  = path.join(DOWNLOADS_DIR, filename);

  fs.writeFileSync(outPath, html, 'utf8');
  console.log(`  ✅ Saved → public/downloads/${filename}`);
  return { filename, section };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('════════════════════════════════════════');
  console.log('  ACTUS Documentation PDF Generator');
  console.log('════════════════════════════════════════');

  // Parse CLI args
  //   npm run generate-pdfs -- [sectionId] [--html-only] [--engine=puppeteer|weasyprint]
  const args          = process.argv.slice(2);
  const htmlOnly      = args.includes('--html-only');
  const engineArg     = (args.find(a => a.startsWith('--engine=')) || '').replace('--engine=', '') || null;
  const sectionFilter = args.find(a => !a.startsWith('--'));

  // Resolve PDF engine (only needed when not in html-only mode)
  let engine = null;
  let puppeteer;

  if (!htmlOnly) {
    engine = detectEngine(engineArg);

    if (!engine) {
      console.error('\n❌  No PDF engine found.');
      console.error('    Option 1: npm install  (downloads Puppeteer + Chrome, ~170 MB)');
      console.error('    Option 2: pip install weasyprint --break-system-packages');
      console.error('    Option 3: preview HTML first:  npm run generate-pdfs:preview\n');
      process.exit(1);
    }

    if (engine === 'puppeteer') {
      puppeteer = require('puppeteer');
    }

    console.log(`\nPDF engine: ${engine}`);
  }

  const allSections = JSON.parse(fs.readFileSync(SECTIONS_FILE, 'utf8'));
  const sections    = sectionFilter
    ? allSections.filter(s => s.id === sectionFilter)
    : allSections;

  if (sections.length === 0) {
    console.error(`\n❌  No section found with id "${sectionFilter}"`);
    console.error(`    Available: ${allSections.map(s => s.id).join(', ')}\n`);
    process.exit(1);
  }

  console.log(`\nMode: ${htmlOnly ? 'HTML preview' : 'PDF'}`);
  console.log(`Sections: ${sections.map(s => s.shortTitle || s.title).join(', ')}`);

  const generated = [];
  for (const section of sections) {
    let result;
    if (htmlOnly) {
      result = await generateSectionHtmlPreview(section);
    } else if (engine === 'weasyprint') {
      result = await generateSectionPdfWeasyprint(section);
    } else {
      result = await generateSectionPdf(section, puppeteer);
    }
    if (result) generated.push(result);
  }

  if (!htmlOnly) {
    updateResources(generated);
  }

  console.log('\n════════════════════════════════════════');
  console.log(`  Done — ${generated.length} file(s) generated`);
  if (htmlOnly) {
    console.log('  Open the .html files in public/downloads/ to preview');
    console.log('  Run without --html-only to generate PDFs');
  }
  console.log('════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('\n❌  Fatal error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
