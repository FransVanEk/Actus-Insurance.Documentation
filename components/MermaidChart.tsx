'use client'

import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

let initialized = false

// Global classDef preamble injected into every diagram so markdown files
// can reference semantic class names instead of inline fill/stroke/color values.
const GLOBAL_CLASSDEFS = `
  classDef nodeNeutral fill:#243344,stroke:#8FAAB8,color:#e2e8f0
  classDef nodeNavy    fill:#1A3550,stroke:#D4891A,color:#ffffff
  classDef nodeAmber   fill:#D4891A,stroke:#e6a040,color:#ffffff
  classDef nodeSuccess fill:#3a8a7a,stroke:#5ab89a,color:#e2e8f0
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
        lineColor: '#D4891A',
        secondaryColor: '#fef3e0',
        tertiaryColor: '#f0f4f8',
        background: '#ffffff',
        mainBkg: '#e8f0f7',
        nodeBorder: '#1A3550',
        clusterBkg: '#f0f4f8',
        titleColor: '#0D2038',
        edgeLabelBackground: '#1a2836',
        fontFamily: 'Arial, Helvetica, sans-serif',
      },
      securityLevel: 'loose',
      flowchart: {
        wrappingWidth: 600,
        htmlLabels: true,
      },
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
            // Thicken all arrow/edge paths
            svgEl.querySelectorAll('.flowchart-link, .edge-path, path.path').forEach((el) => {
              ;(el as SVGElement).style.strokeWidth = '2.5px'
            })
            // Move all edgeLabel groups to end of their parent so they render on top in SVG z-order
            svgEl.querySelectorAll('.edgeLabel').forEach((el) => {
              el.parentNode?.appendChild(el)
            })
            // Ensure edge label backgrounds are opaque (works for both SVG rect and HTML foreignObject)
            svgEl.querySelectorAll('.edgeLabel rect').forEach((el) => {
              (el as SVGElement).setAttribute('fill', '#1a2836')
            })
            svgEl.querySelectorAll('.edgeLabel foreignObject div, .edgeLabel foreignObject span, .edgeLabel foreignObject p').forEach((el) => {
              const e = el as HTMLElement
              e.style.setProperty('background-color', '#1a2836', 'important')
              e.style.setProperty('color', '#D4891A', 'important')
            })
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
