'use client'

import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

let initialized = false

// Global classDef preamble injected into every diagram so markdown files
// can reference semantic class names instead of inline fill/stroke/color values.
const GLOBAL_CLASSDEFS = `
  classDef nodeNeutral fill:#334155,stroke:#94a3b8,color:#e2e8f0
  classDef nodeNavy    fill:#1A3550,stroke:#D4891A,color:#ffffff
  classDef nodeAmber   fill:#D4891A,stroke:#92400e,color:#ffffff
  classDef nodeSuccess fill:#14532d,stroke:#4ade80,color:#e2e8f0
`

function initMermaid() {
  if (!initialized) {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        // Default node colours match the site's light navy/amber palette
        primaryColor: '#e8f0f7',
        primaryTextColor: '#0D2038',
        primaryBorderColor: '#1A3550',
        lineColor: '#1A3550',
        secondaryColor: '#fef3e0',
        tertiaryColor: '#f0f4f8',
        background: '#ffffff',
        mainBkg: '#e8f0f7',
        nodeBorder: '#1A3550',
        clusterBkg: '#f0f4f8',
        titleColor: '#0D2038',
        edgeLabelBackground: '#ffffff',
        fontFamily: 'Arial, Helvetica, sans-serif',
      },
      securityLevel: 'loose',
    })
    initialized = true
  }
}

// Only graph/flowchart diagrams support classDef syntax.
// Other types (gantt, xychart-beta, stateDiagram-v2, sequenceDiagram, …)
// will error if classDef lines are appended to them.
const FLOWCHART_RE = /^\s*(graph|flowchart)\b/i

function injectClassDefs(chart: string): string {
  if (!FLOWCHART_RE.test(chart)) return chart
  return chart.trimEnd() + '\n' + GLOBAL_CLASSDEFS
}

interface MermaidChartProps {
  chart: string
}

export function MermaidChart({ chart }: MermaidChartProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    initMermaid()

    const id = 'mermaid-' + Math.random().toString(36).slice(2, 9)

    mermaid
      .render(id, injectClassDefs(chart))
      .then(({ svg }) => {
        if (ref.current) {
          ref.current.innerHTML = svg
          // Mark the SVG viewport as overflow:visible so that text which
          // renders slightly wider than Mermaid's internal measurement
          // (e.g. due to font loading timing) is never clipped.
          const svgEl = ref.current.querySelector('svg')
          if (svgEl) {
            svgEl.style.overflow = 'visible'
          }
        }
      })
      .catch((err) => {
        setError(String(err))
      })
  }, [chart])

  if (error) {
    return (
      <pre className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm overflow-x-auto">
        Mermaid error: {error}
      </pre>
    )
  }

  return (
    <div
      ref={ref}
      className="mermaid-diagram my-6 overflow-x-auto"
    />
  )
}
