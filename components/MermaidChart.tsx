'use client'

import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

let initialized = false

function initMermaid() {
  if (!initialized) {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
    })
    initialized = true
  }
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
      .render(id, chart)
      .then(({ svg }) => {
        if (ref.current) {
          ref.current.innerHTML = svg
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
      className="flex justify-center my-6 overflow-x-auto"
    />
  )
}
