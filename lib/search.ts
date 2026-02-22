import Fuse from 'fuse.js'
import { DocContent } from './markdown'

export interface SearchResult {
  item: DocContent
  matches?: Fuse.FuseResultMatch[]
  score?: number
}

const fuseOptions: Fuse.IFuseOptions<DocContent> = {
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

export function initializeSearch(docs: DocContent[]): void {
  // Content is already cleaned by the API endpoint
  fuse = new Fuse(docs, fuseOptions)
}

export function searchDocs(query: string): SearchResult[] {
  if (!fuse || !query.trim()) {
    return []
  }
  
  const searchQuery = query.trim()
  const allResults: SearchResult[] = []
  
  // Get all documents for manual filtering
  const allDocs = (fuse as any)._docs || []
  
  // First pass: Find exact word matches (case insensitive)
  allDocs.forEach((doc: DocContent) => {
    const titleMatch = doc.metadata.title.toLowerCase().includes(searchQuery.toLowerCase())
    const descriptionMatch = doc.metadata.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const contentMatch = doc.content.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (titleMatch || descriptionMatch || contentMatch) {
      allResults.push({
        item: doc,
        matches: [
          ...(titleMatch ? [{ key: 'metadata.title', value: doc.metadata.title, indices: [[0, 1]] }] : []),
          ...(descriptionMatch ? [{ key: 'metadata.description', value: doc.metadata.description || '', indices: [[0, 1]] }] : []),
          ...(contentMatch ? [{ key: 'content', value: doc.content, indices: [[0, 1]] }] : [])
        ],
        score: 0
      })
    }
  })
  
  // If no exact matches found, fall back to fuzzy search
  if (allResults.length === 0) {
    const fuseResults = fuse.search(searchQuery, { limit: 10, threshold: 0.4 })
    return fuseResults.map(result => ({
      item: result.item,
      matches: result.matches,
      score: result.score,
    }))
  }
  
  // Sort exact matches by relevance (title matches first)
  return allResults.sort((a, b) => {
    const aHasTitle = a.matches?.some(m => m.key === 'metadata.title') ? 1 : 0
    const bHasTitle = b.matches?.some(m => m.key === 'metadata.title') ? 1 : 0
    return bHasTitle - aHasTitle
  }).slice(0, 10)
}

export function highlightMatch(text: string, matches?: Fuse.FuseResultMatch[], originalQuery?: string): string {
  if (!originalQuery || originalQuery.trim().length < 2) {
    return text
  }
  
  const query = originalQuery.trim()
  
  // Simple case-insensitive string replacement
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}