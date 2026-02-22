'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Dialog } from '@headlessui/react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { searchDocs, initializeSearch, highlightMatch, SearchResult } from '../lib/search'
import { DocContent } from '../lib/markdown'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [docsInitialized, setDocsInitialized] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Initialize search index - force refresh every time modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      setDocsInitialized(false) // Force refresh
      fetch('/api/docs?' + Date.now()) // Cache bust
        .then(res => res.json())
        .then((docs: DocContent[]) => {
          initializeSearch(docs)
          setDocsInitialized(true)
          setIsLoading(false)
        })
        .catch(err => {
          setIsLoading(false)
        })
    }
  }, [isOpen])

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Search when query changes
  useEffect(() => {
    if (docsInitialized && query.trim()) {
      const searchResults = searchDocs(query)
      setResults(searchResults)
    } else {
      setResults([])
    }
  }, [query, docsInitialized])

  const handleClose = () => {
    setQuery('')
    setResults([])
    onClose()
  }

  const generatePreview = (content: string, maxLength: number = 150, searchQuery?: string): string => {
    // If there's a search query, try to find a snippet that contains it
    if (searchQuery && searchQuery.trim().length >= 2) {
      const query = searchQuery.trim()
      const lowerContent = content.toLowerCase()
      const lowerQuery = query.toLowerCase()
      const queryIndex = lowerContent.indexOf(lowerQuery)
      
      if (queryIndex !== -1) {
        // Found the query in content, create a snippet around it
        const start = Math.max(0, queryIndex - 75) 
        const end = Math.min(content.length, queryIndex + query.length + 75)
        const snippet = content.substring(start, end)
        const prefix = start > 0 ? '...' : ''
        const suffix = end < content.length ? '...' : ''
        return prefix + snippet + suffix
      }
    }
    
    // Fallback to start of content if query not found or no query
    if (content.length <= maxLength) return content
    
    const truncated = content.substring(0, maxLength)
    const lastSpaceIndex = truncated.lastIndexOf(' ')
    return lastSpaceIndex > 0 ? truncated.substring(0, lastSpaceIndex) + '...' : truncated + '...'
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-25" />
      
      <div className="fixed inset-0 overflow-y-auto p-4 sm:p-6 md:p-20">
        <Dialog.Panel
          className="mx-auto max-w-xl transform overflow-hidden rounded-xl shadow-2xl ring-1 transition-all"
          style={{ backgroundColor: '#0D2038', borderColor: '#D4891A30' }}
        >
          {/* Search Input */}
          <div className="relative" style={{ borderBottom: '1px solid #D4891A20' }}>
            <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-3.5 h-5 w-5" style={{ color: '#D4891A' }} />
            <input
              ref={inputRef}
              type="text"
              className="h-12 w-full border-0 bg-transparent pl-11 pr-4 focus:ring-0 sm:text-sm"
              style={{ color: 'white' }}
              placeholder="Search documentation..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="px-6 py-14 text-center text-sm" style={{ color: '#9FB8D0' }}>
              Initializing search...
            </div>
          )}

          {/* No Query */}
          {!isLoading && !query.trim() && (
            <div className="px-6 py-14 text-center text-sm" style={{ color: '#9FB8D0' }}>
              Type to search documentation
            </div>
          )}

          {/* No Results */}
          {!isLoading && query.trim() && results.length === 0 && docsInitialized && (
            <div className="px-6 py-14 text-center text-sm" style={{ color: '#9FB8D0' }}>
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <ul className="max-h-72 scroll-py-2 overflow-y-auto py-2 text-sm" style={{ borderTop: '1px solid #D4891A20', color: 'white' }}>
              {results.map((result, index) => (
                <li key={`${result.item.metadata.slug}-${index}`}>
                  <Link
                    href={`/docs/${result.item.metadata.slug}`}
                    className="block cursor-pointer select-none px-4 py-3 hover:bg-[#1A3550] transition-colors"
                    onClick={handleClose}
                  >
                    <div className="flex items-start">
                      <div className="flex-1">
                        <h3
                          className="font-medium text-white"
                          dangerouslySetInnerHTML={{
                            __html: highlightMatch(result.item.metadata.title, result.matches?.filter(m => m.key === 'metadata.title'), query)
                          }}
                        />
                        {result.item.metadata.description && (
                          <p
                            className="mt-1"
                            style={{ color: '#9FB8D0' }}
                            dangerouslySetInnerHTML={{
                              __html: highlightMatch(result.item.metadata.description, result.matches?.filter(m => m.key === 'metadata.description'), query)
                            }}
                          />
                        )}
                        <p
                          className="mt-1 text-xs"
                          style={{ color: '#9FB8D0' }}
                          dangerouslySetInnerHTML={{
                            __html: highlightMatch(generatePreview(result.item.content, 200, query), result.matches?.filter(m => m.key === 'content'), query)
                          }}
                        />
                        {result.item.metadata.category && (
                          <div className="mt-2">
                            <span
                              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                              style={{ backgroundColor: '#D4891A25', color: '#D4891A' }}
                            >
                              {result.item.metadata.category}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}