import properNouns from '../config/proper-nouns.json'

// Sorted longest-first so multi-word names (e.g. "Monte Carlo") are matched before single words
const SORTED_PROPER_NOUNS = [...(properNouns as string[])].sort((a, b) => b.length - a.length)

/**
 * Convert text to sentence case while:
 * - Preserving ALL-CAPS acronyms detected in the original text (GPU, PAM, API…)
 * - Restoring proper nouns / mixed-case names from config/proper-nouns.json
 */
export function toSentenceCase(text: string): string {
  if (!text) return text

  // Collect all-caps words from the original (2+ letters = likely an acronym/initialism)
  const acronyms = new Set<string>()
  text.replace(/\b([A-Z]{2,})\b/g, (_, w) => { acronyms.add(w); return w })

  // Lowercase everything, then re-capitalise after sentence-ending punctuation and at start
  let result = text.toLowerCase().replace(
    /(^|[.!?]\s+)([\wÀ-ÿ])/g,
    (_, boundary, char) => boundary + char.toUpperCase()
  )

  // Restore ALL-CAPS acronyms
  acronyms.forEach(acr => {
    result = result.replace(new RegExp(`\\b${acr.toLowerCase()}\\b`, 'g'), acr)
  })

  // Restore curated proper nouns
  SORTED_PROPER_NOUNS.forEach(name => {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    result = result.replace(new RegExp(escaped, 'gi'), name)
  })

  return result
}

/**
 * Recursively apply toSentenceCase to all string leaf nodes in a React children tree.
 * Safe to use inside ReactMarkdown heading renderers.
 */
export function applyToReactChildren(children: React.ReactNode): React.ReactNode {
  if (typeof children === 'string') return toSentenceCase(children)
  if (Array.isArray(children)) {
    return children.map(child => applyToReactChildren(child))
  }
  if (
    children !== null &&
    typeof children === 'object' &&
    'props' in (children as object)
  ) {
    const el = children as React.ReactElement<{ children?: React.ReactNode }>
    return React.cloneElement(el, {}, applyToReactChildren(el.props.children))
  }
  return children
}

// React is needed for cloneElement — imported at runtime by every client component that uses this
// We declare the import here so the module is self-contained.
import React from 'react'
