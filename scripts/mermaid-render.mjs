/**
 * mermaid-render.mjs
 *
 * Pure-JavaScript server-side Mermaid → SVG renderer.
 * No browser required.  Uses @dagrejs/dagre for graph layout.
 *
 * Supported diagram types:
 *   graph TD / LR     (and  flowchart TD / LR)
 *   sequenceDiagram
 *   stateDiagram-v2   (rendered as a graph)
 *   classDiagram      (simplified)
 *   xychart-beta      (bar chart only)
 *   gantt             (basic timeline)
 *
 * Usage:
 *   import { renderMermaid } from './scripts/mermaid-render.mjs';
 *   const svg = await renderMermaid(source, 'unique-id');
 */

// ---------------------------------------------------------------------------
// Locate dagre relative to this script
// ---------------------------------------------------------------------------
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require   = createRequire(import.meta.url);

// Try project node_modules first, then the ssrender helper location
let dagre;
try {
  dagre = require(path.join(__dirname, '..', 'node_modules', '@dagrejs', 'dagre'));
} catch {
  dagre = require(path.join('/sessions/sharp-busy-keller/ssrender/node_modules/@dagrejs/dagre'));
}

// ---------------------------------------------------------------------------
// Theme colours (match the PDF/site design)
// ---------------------------------------------------------------------------
const T = {
  navy:    '#0D2038',
  navyMid: '#1A3550',
  amber:   '#D4891A',
  light:   '#9FB8D0',
  white:   '#ffffff',
  textDark:'#1a202c',
  border:  '#e2e8f0',
  codeBg:  '#f0f4f8',
  green:   '#2e7d32',
  red:     '#c62828',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/** Rough pixel width of a string at ~13px Arial */
const textW = s => (s ?? '').replace(/\\n/g, ' ').length * 7.2;

/** Split on \n or <br/> for multi-line labels */
const lines = s => String(s ?? '').split(/\\n|<br\s*\/?>/).map(l => l.trim()).filter(Boolean);

// ---------------------------------------------------------------------------
// ── GRAPH / FLOWCHART ───────────────────────────────────────────────────────
// ---------------------------------------------------------------------------

/**
 * Parse Mermaid graph/flowchart syntax.
 * Returns { direction, nodes, edges, subgraphs }
 */
function parseGraph(src) {
  const direction = /\b(LR|RL|TD|TB|BT)\b/.test(src)
    ? src.match(/\b(LR|RL|TD|TB|BT)\b/)[1]
    : 'TD';

  const nodes     = {};   // id → { id, label, shape }
  const edges     = [];   // { from, to, label, style }
  const subgraphs = [];   // { title, nodeIds[] }

  // Strip comments
  const clean = src.replace(/%%.*$/gm, '');

  // Track current subgraph
  let currentSubgraph = null;
  const subgraphStack = [];

  for (const rawLine of clean.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;

    // Subgraph start
    const sgMatch = line.match(/^subgraph\s+(.+)$/i);
    if (sgMatch) {
      const title = sgMatch[1].replace(/^["']|["']$/g, '').trim();
      const sg = { title, nodeIds: [] };
      subgraphs.push(sg);
      subgraphStack.push(sg);
      currentSubgraph = sg;
      continue;
    }
    if (/^end\s*$/.test(line)) {
      subgraphStack.pop();
      currentSubgraph = subgraphStack[subgraphStack.length - 1] ?? null;
      continue;
    }

    // Skip directive lines
    if (/^(graph|flowchart|style|classDef|class|linkStyle|click|direction)\b/i.test(line)) continue;

    // Edge patterns — handle before node-only lines
    // Supported arrow types: -->, --->, -.->  , ==>  , -- text -->, -. text .->
    const edgePat = /^(.+?)\s*(-->|--?>|-.->|===>?|--\s.+?\s-->|-\.\s.+?\s\.->|--\s.+?\s---)\s*(.+)$/;
    const em = line.match(edgePat);
    if (em) {
      const fromRaw = em[1].trim();
      const arrow   = em[2].trim();
      const toRaw   = em[3].trim();

      // Extract edge label from arrow like  -- label --> or |label|
      let edgeLabel = '';
      const arrowLabel = arrow.match(/^--\s+(.+?)\s+-->$/) || arrow.match(/^-\.\s+(.+?)\s+\.->$/);
      if (arrowLabel) edgeLabel = arrowLabel[1];

      // Parse  --> |label| target
      let toFull = toRaw;
      const pipeLabel = toFull.match(/^\|([^|]+)\|\s*(.+)/);
      if (pipeLabel) { edgeLabel = pipeLabel[1]; toFull = pipeLabel[2].trim(); }

      const fromId = extractNodeDef(fromRaw, nodes, currentSubgraph);
      const toId   = extractNodeDef(toFull,  nodes, currentSubgraph);
      const style  = arrow.includes('-.') ? 'dashed' : arrow.includes('=') ? 'thick' : 'solid';
      edges.push({ from: fromId, to: toId, label: edgeLabel, style });
      continue;
    }

    // Standalone node definition
    if (/[\[\({]/.test(line) || /^[A-Za-z_][\w-]*(\s|$)/.test(line)) {
      extractNodeDef(line, nodes, currentSubgraph);
    }
  }

  return { direction, nodes, edges, subgraphs };
}

function extractNodeDef(raw, nodes, subgraph) {
  // Remove trailing arrow remnants
  raw = raw.trim();

  // Match: ID["label"]  ID("label")  ID{label}  ID([label])  ID[[label]]  ID[(label)]  ID>"label"]
  const shapes = [
    { re: /^([\w-]+)\s*\[\[([^\]]+)\]\]/,   shape: 'subroutine'  },
    { re: /^([\w-]+)\s*\[\("([^)]+)"\)\]/,  shape: 'cylinder'    },
    { re: /^([\w-]+)\s*\(\[([^\]]+)\]\)/,   shape: 'stadium'     },
    { re: /^([\w-]+)\s*\{([^}]+)\}/,        shape: 'diamond'     },
    { re: /^([\w-]+)\s*\("([^"]+)"\)/,      shape: 'round'       },
    { re: /^([\w-]+)\s*\(([^)]+)\)/,        shape: 'round'       },
    { re: /^([\w-]+)\s*\["([^"]+)"\]/,      shape: 'rect'        },
    { re: /^([\w-]+)\s*\[([^\]]+)\]/,       shape: 'rect'        },
    { re: /^([\w-]+)\s*>"([^"]+)"]/,        shape: 'asymmetric'  },
    { re: /^([\w-]+)\s*\/([^/]+)\//,        shape: 'trapezoid'   },
  ];

  let id, label, shape = 'rect';
  for (const { re, shape: s } of shapes) {
    const m = raw.match(re);
    if (m) { id = m[1]; label = m[2] ?? m[1]; shape = s; break; }
  }
  if (!id) {
    // Plain id only
    const m = raw.match(/^([\w-]+)/);
    if (!m) return null;
    id = m[1]; label = m[1];
  }

  if (!nodes[id]) {
    nodes[id] = { id, label, shape };
  }
  if (subgraph && !subgraph.nodeIds.includes(id)) {
    subgraph.nodeIds.push(id);
  }
  return id;
}

function renderGraphSvg(src, uid) {
  const parsed = parseGraph(src);
  const { direction, nodes, edges, subgraphs } = parsed;

  // Build dagre graph
  const g = new dagre.graphlib.Graph({ compound: true });
  g.setGraph({
    rankdir:  direction === 'LR' || direction === 'RL' ? 'LR' : 'TB',
    ranksep:  60,
    nodesep:  40,
    edgesep:  20,
    marginx:  20,
    marginy:  20,
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Add subgraph clusters
  subgraphs.forEach((sg, i) => {
    const sgId = `__sg${i}`;
    sg._dagId = sgId;
    g.setNode(sgId, { label: sg.title });
  });

  // Add nodes
  Object.values(nodes).forEach(n => {
    const lblLines = lines(n.label);
    const maxLen   = Math.max(...lblLines.map(l => l.length));
    const w = Math.max(maxLen * 7.5 + 32, 60);
    const h = Math.max(lblLines.length * 18 + 20, 36);
    g.setNode(n.id, { label: n.label, width: w, height: h, shape: n.shape });

    // Assign to subgraph if applicable
    const sg = subgraphs.find(s => s.nodeIds.includes(n.id));
    if (sg) g.setParent(n.id, sg._dagId);
  });

  // Add edges
  edges.forEach((e, i) => {
    if (!e.from || !e.to || !g.node(e.from) || !g.node(e.to)) return;
    g.setEdge(e.from, e.to, { label: e.label, style: e.style, id: `e${i}` });
  });

  dagre.layout(g);

  const gInfo = g.graph();
  const W = (gInfo.width  || 400) + 40;
  const H = (gInfo.height || 200) + 40;

  let svg = `<svg id="${esc(uid)}" xmlns="http://www.w3.org/2000/svg" `
          + `viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" `
          + `style="font-family:Arial,sans-serif;font-size:13px;max-width:100%;">\n`;

  // Defs: arrowhead
  svg += `<defs>
  <marker id="${uid}-arr" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
    <polygon points="0 0, 10 3.5, 0 7" fill="${T.navyMid}"/>
  </marker>
  <marker id="${uid}-arr-d" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
    <polygon points="0 0, 10 3.5, 0 7" fill="${T.amber}" opacity="0.7"/>
  </marker>
</defs>\n`;

  // Draw subgraph backgrounds
  subgraphs.forEach((sg) => {
    const sgNode = g.node(sg._dagId);
    if (!sgNode) return;
    const pad = 12;
    const x = sgNode.x - sgNode.width  / 2 - pad;
    const y = sgNode.y - sgNode.height / 2 - pad;
    const w = (sgNode.width  || 100) + pad * 2;
    const h = (sgNode.height || 60)  + pad * 2;
    svg += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" `
         + `rx="8" fill="${T.codeBg}" stroke="${T.border}" stroke-width="1.5" stroke-dasharray="5,3"/>\n`;
    svg += `<text x="${(x + 8).toFixed(1)}" y="${(y + 16).toFixed(1)}" `
         + `font-size="11" fill="${T.navyMid}" font-weight="600">${esc(sg.title)}</text>\n`;
  });

  // Draw edges
  g.edges().forEach(e => {
    const edgeData = g.edge(e);
    if (!edgeData || !edgeData.points || edgeData.points.length < 2) return;
    const pts = edgeData.points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const dashed = edgeData.style === 'dashed';
    const arrId  = dashed ? `${uid}-arr-d` : `${uid}-arr`;
    const stroke = dashed ? T.amber : T.navyMid;
    const dash   = dashed ? 'stroke-dasharray="6,4"' : '';
    svg += `<polyline points="${pts}" fill="none" stroke="${stroke}" stroke-width="1.8" `
         + `${dash} marker-end="url(#${arrId})"/>\n`;

    // Edge label
    if (edgeData.label) {
      const mid = edgeData.points[Math.floor(edgeData.points.length / 2)];
      svg += `<rect x="${(mid.x - edgeData.label.length * 3.5).toFixed(1)}" y="${(mid.y - 10).toFixed(1)}" `
           + `width="${(edgeData.label.length * 7 + 6).toFixed(1)}" height="14" fill="white" opacity="0.85"/>\n`;
      svg += `<text x="${mid.x.toFixed(1)}" y="${mid.y.toFixed(1)}" text-anchor="middle" `
           + `dominant-baseline="middle" font-size="11" fill="${T.textDark}">${esc(edgeData.label)}</text>\n`;
    }
  });

  // Draw nodes
  g.nodes().forEach(nId => {
    if (nId.startsWith('__sg')) return; // skip cluster placeholders
    const n = g.node(nId);
    if (!n) return;
    const x = n.x - n.width  / 2;
    const y = n.y - n.height / 2;
    const w = n.width;
    const h = n.height;
    const cx = n.x, cy = n.y;
    const parsedNode = nodes[nId];
    const shape = parsedNode?.shape ?? 'rect';

    // Background shape
    if (shape === 'diamond') {
      const hw = w / 2 + 10, hh = h / 2 + 10;
      svg += `<polygon points="${cx},${cy-hh} ${cx+hw},${cy} ${cx},${cy+hh} ${cx-hw},${cy}" `
           + `fill="${T.navyMid}" stroke="${T.amber}" stroke-width="1.5"/>\n`;
    } else if (shape === 'round' || shape === 'stadium') {
      svg += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" `
           + `rx="${(h/2).toFixed(1)}" fill="${T.navyMid}" stroke="${T.amber}" stroke-width="1.5"/>\n`;
    } else if (shape === 'cylinder') {
      const ry = 8;
      svg += `<rect x="${x.toFixed(1)}" y="${(y+ry).toFixed(1)}" width="${w.toFixed(1)}" height="${(h-ry).toFixed(1)}" `
           + `fill="${T.navyMid}" stroke="${T.amber}" stroke-width="1.5"/>\n`;
      svg += `<ellipse cx="${cx.toFixed(1)}" cy="${(y+ry).toFixed(1)}" rx="${(w/2).toFixed(1)}" ry="${ry}" `
           + `fill="${T.navyMid}" stroke="${T.amber}" stroke-width="1.5"/>\n`;
    } else {
      svg += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" `
           + `rx="5" fill="${T.navyMid}" stroke="${T.amber}" stroke-width="1.5"/>\n`;
    }

    // Node label
    const lblLines = lines(parsedNode?.label ?? nId);
    const lineH = 16;
    const totalH = lblLines.length * lineH;
    lblLines.forEach((lbl, i) => {
      const ty = cy - totalH / 2 + lineH * i + lineH * 0.72;
      svg += `<text x="${cx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="middle" `
           + `font-size="12" fill="${T.white}" font-family="Arial,sans-serif">${esc(lbl)}</text>\n`;
    });
  });

  svg += '</svg>';
  return svg;
}

// ---------------------------------------------------------------------------
// ── SEQUENCE DIAGRAM ─────────────────────────────────────────────────────────
// ---------------------------------------------------------------------------
function renderSequenceSvg(src, uid) {
  const actors  = [];
  const actorSet = new Set();
  const messages = [];

  for (const rawLine of src.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('sequenceDiagram') || line.startsWith('%%')) continue;

    // participant / actor declarations
    const partMatch = line.match(/^(?:participant|actor)\s+(\S+)(?:\s+as\s+(.+))?$/i);
    if (partMatch) {
      const id = partMatch[1], label = partMatch[2] || partMatch[1];
      if (!actorSet.has(id)) { actors.push({ id, label }); actorSet.add(id); }
      continue;
    }
    // Note: note over A: text
    const noteMatch = line.match(/^note\s+(?:over|left of|right of)\s+([\w, ]+)\s*:\s*(.+)$/i);
    if (noteMatch) {
      messages.push({ type: 'note', actors: noteMatch[1].split(',').map(s=>s.trim()), text: noteMatch[2] });
      continue;
    }
    // Message arrows: A ->> B: text  /  A -> B: text  /  A -->> B: text
    const msgMatch = line.match(/^([\w ]+?)\s*(->>?|-->>?|->|-->)\s*([\w ]+?)\s*:\s*(.*)$/);
    if (msgMatch) {
      const from = msgMatch[1].trim(), arrow = msgMatch[2], to = msgMatch[3].trim(), text = msgMatch[4];
      if (!actorSet.has(from)) { actors.push({ id: from, label: from }); actorSet.add(from); }
      if (!actorSet.has(to))   { actors.push({ id: to,   label: to   }); actorSet.add(to); }
      messages.push({ type: 'msg', from, to, arrow, text });
    }
  }

  const PAD_X  = 40, PAD_Y  = 20;
  const COL_W  = 160;
  const ROW_H  = 40;
  const HDR_H  = 50;

  const W = actors.length * COL_W + PAD_X * 2;
  const H = (messages.length + 1) * ROW_H + HDR_H + PAD_Y * 2;

  const actorX = (id) => {
    const i = actors.findIndex(a => a.id === id);
    return PAD_X + COL_W / 2 + i * COL_W;
  };

  let svg = `<svg id="${esc(uid)}" xmlns="http://www.w3.org/2000/svg" `
          + `viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" `
          + `style="font-family:Arial,sans-serif;font-size:13px;max-width:100%;">\n`;
  svg += `<defs>
  <marker id="${uid}-sa" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
    <polygon points="0 0,8 3,0 6" fill="${T.navyMid}"/>
  </marker>
</defs>\n`;

  // Background
  svg += `<rect width="${W}" height="${H}" fill="white"/>\n`;

  // Actor boxes (top)
  actors.forEach(a => {
    const x = actorX(a.id);
    const bw = Math.max(a.label.length * 7.5 + 20, 80);
    svg += `<rect x="${(x - bw/2).toFixed(1)}" y="${PAD_Y}" width="${bw}" height="32" `
         + `rx="4" fill="${T.navyMid}" stroke="${T.amber}" stroke-width="1.5"/>\n`;
    svg += `<text x="${x}" y="${PAD_Y + 20}" text-anchor="middle" dominant-baseline="middle" `
         + `font-size="12" fill="${T.white}" font-weight="600">${esc(a.label)}</text>\n`;
    // Lifeline
    svg += `<line x1="${x}" y1="${PAD_Y + 32}" x2="${x}" y2="${H - PAD_Y - 32}" `
         + `stroke="${T.border}" stroke-width="1.5" stroke-dasharray="4,3"/>\n`;
  });

  // Messages
  messages.forEach((m, i) => {
    const y = PAD_Y + HDR_H + i * ROW_H + ROW_H / 2;

    if (m.type === 'note') {
      const xs = m.actors.map(a => actorX(a));
      const x1 = Math.min(...xs) - 30, x2 = Math.max(...xs) + 30;
      svg += `<rect x="${x1}" y="${y - 12}" width="${x2-x1}" height="24" `
           + `rx="4" fill="#fff9e6" stroke="${T.amber}" stroke-width="1"/>\n`;
      svg += `<text x="${(x1+x2)/2}" y="${y}" text-anchor="middle" dominant-baseline="middle" `
           + `font-size="11" fill="${T.textDark}" font-style="italic">${esc(m.text)}</text>\n`;
      return;
    }

    const x1 = actorX(m.from), x2 = actorX(m.to);
    const dashed = m.arrow.startsWith('--');
    const dash = dashed ? 'stroke-dasharray="5,3"' : '';
    svg += `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${T.navyMid}" `
         + `stroke-width="1.5" ${dash} marker-end="url(#${uid}-sa)"/>\n`;
    // Label
    const mx = (x1 + x2) / 2;
    svg += `<text x="${mx}" y="${y - 6}" text-anchor="middle" `
         + `font-size="11" fill="${T.textDark}">${esc(m.text)}</text>\n`;
  });

  // Actor boxes (bottom)
  actors.forEach(a => {
    const x = actorX(a.id);
    const bw = Math.max(a.label.length * 7.5 + 20, 80);
    svg += `<rect x="${(x - bw/2).toFixed(1)}" y="${H - PAD_Y - 32}" width="${bw}" height="32" `
         + `rx="4" fill="${T.navyMid}" stroke="${T.amber}" stroke-width="1.5"/>\n`;
    svg += `<text x="${x}" y="${H - PAD_Y - 16}" text-anchor="middle" dominant-baseline="middle" `
         + `font-size="12" fill="${T.white}" font-weight="600">${esc(a.label)}</text>\n`;
  });

  svg += '</svg>';
  return svg;
}

// ---------------------------------------------------------------------------
// ── CLASS DIAGRAM ────────────────────────────────────────────────────────────
// ---------------------------------------------------------------------------
function renderClassSvg(src, uid) {
  const classes = {};
  const relations = [];

  for (const rawLine of src.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('classDiagram') || line.startsWith('%%')) continue;

    // class Foo { ... }  or  class Foo
    const clsMatch = line.match(/^class\s+([\w]+)(?:\s*\{)?$/);
    if (clsMatch) {
      const id = clsMatch[1];
      if (!classes[id]) classes[id] = { id, members: [] };
      continue;
    }
    // Member inside a class block:  +method()  -field  #protected
    const memberMatch = line.match(/^([+\-#~])\s*(.+)$/);
    if (memberMatch) {
      // Find the most recently declared class and add the member
      const ids = Object.keys(classes);
      if (ids.length > 0) {
        classes[ids[ids.length - 1]].members.push(memberMatch[1] + memberMatch[2]);
      }
      continue;
    }
    // Closing brace
    if (line === '}') continue;

    // Relation:  A <|-- B   A --> B   A "1" --> "n" B
    const relMatch = line.match(/^([\w]+)\s*([<|*o]+[-]+[>|*o]*|[-]+[>|*o]*)\s*([\w]+)/);
    if (relMatch) {
      relations.push({ from: relMatch[1], arrow: relMatch[2], to: relMatch[3] });
      const ids = [relMatch[1], relMatch[3]];
      ids.forEach(id => { if (!classes[id]) classes[id] = { id, members: [] }; });
    }
  }

  const BOX_W = 160, ROW_H = 22, HDR_H = 30, PAD = 30;
  const classArr = Object.values(classes);
  const cols = Math.ceil(Math.sqrt(classArr.length)) || 1;
  const rows = Math.ceil(classArr.length / cols);

  // Simple grid layout
  classArr.forEach((cls, i) => {
    cls._x = PAD + (i % cols) * (BOX_W + PAD);
    cls._y = PAD + Math.floor(i / cols) * (HDR_H + cls.members.length * ROW_H + ROW_H + PAD);
    cls._h = HDR_H + cls.members.length * ROW_H + 10;
  });

  const W = cols * (BOX_W + PAD) + PAD;
  const H = rows * (HDR_H + 80 + PAD) + PAD;

  let svg = `<svg id="${esc(uid)}" xmlns="http://www.w3.org/2000/svg" `
          + `viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" `
          + `style="font-family:Arial,sans-serif;font-size:13px;max-width:100%;">\n`;
  svg += `<rect width="${W}" height="${H}" fill="white"/>\n`;

  // Relations
  relations.forEach(r => {
    const from = classes[r.from], to = classes[r.to];
    if (!from || !to) return;
    const x1 = from._x + BOX_W / 2, y1 = from._y + from._h / 2;
    const x2 = to._x   + BOX_W / 2, y2 = to._y   + to._h  / 2;
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" `
         + `stroke="${T.navyMid}" stroke-width="1.5" stroke-dasharray="5,3"/>\n`;
  });

  // Class boxes
  classArr.forEach(cls => {
    const x = cls._x, y = cls._y, h = cls._h;
    // Box
    svg += `<rect x="${x}" y="${y}" width="${BOX_W}" height="${h}" `
         + `rx="4" fill="white" stroke="${T.navyMid}" stroke-width="1.5"/>\n`;
    // Header
    svg += `<rect x="${x}" y="${y}" width="${BOX_W}" height="${HDR_H}" `
         + `rx="4" fill="${T.navyMid}"/>\n`;
    svg += `<rect x="${x}" y="${y + HDR_H - 4}" width="${BOX_W}" height="4" fill="${T.navyMid}"/>\n`;
    svg += `<text x="${x + BOX_W/2}" y="${y + HDR_H/2 + 1}" text-anchor="middle" dominant-baseline="middle" `
         + `font-size="13" font-weight="700" fill="${T.white}">${esc(cls.id)}</text>\n`;
    // Members
    cls.members.forEach((m, i) => {
      svg += `<text x="${x + 8}" y="${y + HDR_H + ROW_H * i + ROW_H - 6}" `
           + `font-size="11" fill="${T.textDark}">${esc(m)}</text>\n`;
    });
    // Member separator
    if (cls.members.length > 0) {
      svg += `<line x1="${x}" y1="${y + HDR_H}" x2="${x + BOX_W}" y2="${y + HDR_H}" `
           + `stroke="${T.border}" stroke-width="1"/>\n`;
    }
  });

  svg += '</svg>';
  return svg;
}

// ---------------------------------------------------------------------------
// ── GANTT ────────────────────────────────────────────────────────────────────
// ---------------------------------------------------------------------------
function renderGanttSvg(src, uid) {
  const tasks = [];
  let section = '';
  for (const rawLine of src.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('gantt') || line.startsWith('%%')) continue;
    if (line.startsWith('title')) continue;
    if (line.startsWith('dateFormat') || line.startsWith('axisFormat')) continue;
    const secMatch = line.match(/^section\s+(.+)$/i);
    if (secMatch) { section = secMatch[1]; continue; }
    const taskMatch = line.match(/^(.+?)\s*:\s*(?:done|active|crit|milestone)?\s*,?\s*(\S+?),\s*(\S+),\s*(\S+)$/);
    if (taskMatch) {
      tasks.push({ label: taskMatch[1].trim(), section, id: taskMatch[2], start: taskMatch[3], end: taskMatch[4] });
    }
  }

  const ROW_H = 30, PAD = 20, LBL_W = 180;
  const W = 600, H = tasks.length * ROW_H + PAD * 3;
  const BAR_W = W - LBL_W - PAD * 2;

  let svg = `<svg id="${esc(uid)}" xmlns="http://www.w3.org/2000/svg" `
          + `viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" `
          + `style="font-family:Arial,sans-serif;font-size:12px;max-width:100%;">\n`;
  svg += `<rect width="${W}" height="${H}" fill="white"/>\n`;

  tasks.forEach((t, i) => {
    const y = PAD + i * ROW_H;
    const barX = LBL_W + PAD;
    const frac = (i + 0.5) / Math.max(tasks.length, 1);
    const barW = BAR_W * 0.3 + frac * BAR_W * 0.5;  // approximate proportional bar
    svg += i % 2 === 0
      ? `<rect x="0" y="${y}" width="${W}" height="${ROW_H}" fill="#f8fafc"/>\n`
      : '';
    svg += `<text x="${LBL_W - 6}" y="${y + ROW_H/2 + 1}" text-anchor="end" dominant-baseline="middle" `
         + `font-size="11" fill="${T.textDark}">${esc(t.section ? t.section + ' / ' + t.label : t.label)}</text>\n`;
    svg += `<rect x="${barX}" y="${y + 5}" width="${barW.toFixed(0)}" height="${ROW_H - 10}" `
         + `rx="3" fill="${T.navyMid}"/>\n`;
    svg += `<text x="${barX + barW + 5}" y="${y + ROW_H/2 + 1}" dominant-baseline="middle" `
         + `font-size="10" fill="${T.light}">${esc(t.end)}</text>\n`;
  });

  svg += '</svg>';
  return svg;
}

// ---------------------------------------------------------------------------
// ── XYCHART ──────────────────────────────────────────────────────────────────
// ---------------------------------------------------------------------------
function renderXyChartSvg(src, uid) {
  const lines_ = src.split('\n').map(l => l.trim()).filter(Boolean);
  let title = '', xLabels = [], barData = [];

  for (const line of lines_) {
    if (line.startsWith('xychart-beta')) continue;
    if (line.startsWith('title')) { title = line.replace(/^title\s*["']?/, '').replace(/["']$/, ''); continue; }
    const xMatch = line.match(/^x-axis\s+\[(.+)\]$/);
    if (xMatch) { xLabels = xMatch[1].split(',').map(s => s.trim().replace(/["']/g, '')); continue; }
    const barMatch = line.match(/^bar\s+\[(.+)\]$/);
    if (barMatch) { barData = barMatch[1].split(',').map(s => parseFloat(s.trim())); continue; }
  }

  if (xLabels.length === 0) xLabels = barData.map((_, i) => `${i+1}`);
  const maxVal = Math.max(...barData, 1);
  const PAD = 40, CHART_H = 180, BAR_W = 60;
  const W = xLabels.length * (BAR_W + 20) + PAD * 2;
  const H = CHART_H + PAD * 2 + 30;

  let svg = `<svg id="${esc(uid)}" xmlns="http://www.w3.org/2000/svg" `
          + `viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" `
          + `style="font-family:Arial,sans-serif;font-size:12px;max-width:100%;">\n`;
  svg += `<rect width="${W}" height="${H}" fill="white"/>\n`;
  if (title) {
    svg += `<text x="${W/2}" y="18" text-anchor="middle" font-size="13" font-weight="600" fill="${T.navyMid}">${esc(title)}</text>\n`;
  }
  // Axes
  svg += `<line x1="${PAD}" y1="${PAD}" x2="${PAD}" y2="${PAD + CHART_H}" stroke="${T.navyMid}" stroke-width="1.5"/>\n`;
  svg += `<line x1="${PAD}" y1="${PAD + CHART_H}" x2="${W - PAD}" y2="${PAD + CHART_H}" stroke="${T.navyMid}" stroke-width="1.5"/>\n`;

  barData.forEach((val, i) => {
    const x = PAD + i * (BAR_W + 20) + 10;
    const h = (val / maxVal) * CHART_H;
    const y = PAD + CHART_H - h;
    svg += `<rect x="${x}" y="${y.toFixed(1)}" width="${BAR_W}" height="${h.toFixed(1)}" `
         + `rx="3" fill="${T.navyMid}"/>\n`;
    svg += `<text x="${x + BAR_W/2}" y="${(y - 4).toFixed(1)}" text-anchor="middle" `
         + `font-size="10" fill="${T.navyMid}">${val}</text>\n`;
    if (xLabels[i]) {
      svg += `<text x="${x + BAR_W/2}" y="${PAD + CHART_H + 16}" text-anchor="middle" `
           + `font-size="10" fill="${T.textDark}">${esc(xLabels[i])}</text>\n`;
    }
  });

  svg += '</svg>';
  return svg;
}

// ---------------------------------------------------------------------------
// ── Main export ──────────────────────────────────────────────────────────────
// ---------------------------------------------------------------------------

/**
 * Render a mermaid diagram source string to an SVG string.
 * Returns null if the diagram type is not supported.
 */
export function renderMermaid(source, uid = 'mermaid') {
  const src = source.trim();
  const firstLine = src.split('\n')[0].trim().toLowerCase();

  try {
    if (firstLine.startsWith('graph ') || firstLine.startsWith('flowchart ')) {
      return renderGraphSvg(src, uid);
    }
    if (firstLine.startsWith('sequencediagram')) {
      return renderSequenceSvg(src, uid);
    }
    if (firstLine.startsWith('classdiagram')) {
      return renderClassSvg(src, uid);
    }
    if (firstLine.startsWith('statediagram')) {
      // Map state diagram to graph renderer — works for most cases
      return renderGraphSvg(src.replace(/stateDiagram[-v2]*/i, 'graph LR'), uid);
    }
    if (firstLine.startsWith('gantt')) {
      return renderGanttSvg(src, uid);
    }
    if (firstLine.startsWith('xychart')) {
      return renderXyChartSvg(src, uid);
    }
  } catch (e) {
    // Renderer error — return null so the caller shows the fallback
    return null;
  }
  return null;  // unsupported type
}
