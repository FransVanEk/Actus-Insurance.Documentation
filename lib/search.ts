import Fuse, { type FuseResultMatch, type IFuseOptions } from 'fuse.js'
import { DocContent } from './markdown'

export interface SearchResult {
  item: DocContent
  matches?: readonly FuseResultMatch[]
  score?: number
  occurrences?: number
}

const fuseOptions: IFuseOptions<DocContent> = {
  keys: [
    { name: 'metadata.title', weight: 2 },
    { name: 'metadata.description', weight: 1.5 },
    { name: 'content', weight: 1 },
    { name: 'metadata.category', weight: 0.5 },
  ],
  threshold: 0.4, // Increase threshold for better fuzzy matching
  includeMatches: true,
  includeScore: true,
  minMatchCharLength: 1, // Allow single character matches
  ignoreLocation: true, // Don't weight matches by position
  findAllMatches: true, // Find all matching instances
}

let fuse: Fuse<DocContent> | null = null
let allIndexedDocs: DocContent[] = []

export function initializeSearch(docs: DocContent[]): void {
  // Content is already cleaned by the API endpoint
  allIndexedDocs = docs
  fuse = new Fuse(docs, fuseOptions)
}

export function searchDocs(query: string): SearchResult[] {
  if (!fuse || !query.trim()) {
    return []
  }
  
  const searchQuery = query.trim()
  const lowerQuery = searchQuery.toLowerCase()
  const exactResults: SearchResult[] = []
  
  // Count all occurrences of the query string in a text
  const countOccurrences = (text: string): number => {
    let count = 0
    let pos = 0
    const lower = text.toLowerCase()
    while ((pos = lower.indexOf(lowerQuery, pos)) !== -1) {
      count++
      pos += lowerQuery.length
    }
    return count
  }

  // Find documents with exact (case-insensitive) substring matches
  allIndexedDocs.forEach((doc: DocContent) => {
    const titleMatch = doc.metadata.title.toLowerCase().includes(lowerQuery)
    const descriptionMatch = doc.metadata.description?.toLowerCase().includes(lowerQuery) ?? false
    const contentMatch = doc.content.toLowerCase().includes(lowerQuery)
    
    if (titleMatch || descriptionMatch || contentMatch) {
      // Score: title match = 0 (best), description = 0.1, content-only = 0.2
      const score = titleMatch ? 0 : descriptionMatch ? 0.1 : 0.2
      const occurrences =
        countOccurrences(doc.metadata.title) +
        countOccurrences(doc.metadata.description ?? '') +
        countOccurrences(doc.content)
      exactResults.push({
        item: doc,
        matches: [
          ...(titleMatch ? [{ key: 'metadata.title', value: doc.metadata.title, indices: [[0, 1] as [number, number]] }] : []),
          ...(descriptionMatch ? [{ key: 'metadata.description', value: doc.metadata.description || '', indices: [[0, 1] as [number, number]] }] : []),
          ...(contentMatch ? [{ key: 'content', value: doc.content, indices: [[0, 1] as [number, number]] }] : [])
        ],
        score,
        occurrences,
      })
    }
  })
  
  if (exactResults.length > 0) {
    return exactResults
      .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
      .slice(0, 20)
  }
  
  // Only fall back to fuzzy search (with stricter threshold) when no exact matches exist
  const fuseResults = fuse.search(searchQuery, { limit: 10 })
  return fuseResults
    .filter(r => (r.score ?? 1) <= 0.25) // Only keep close fuzzy matches
    .map(result => ({
      item: result.item,
      matches: result.matches,
      score: result.score,
    }))
}

export function highlightMatch(text: string, matches?: FuseResultMatch[], originalQuery?: string): string {
  if (!originalQuery || originalQuery.trim().length < 2) {
    return text
  }
  
  const query = originalQuery.trim()
  
  // Simple case-insensitive string replacement
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}