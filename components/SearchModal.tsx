'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Dialog } from '@headlessui/react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { searchDocs, initializeSearch, highlightMatch, SearchResult } from '../lib/search'
import { DocContent } from '../lib/markdown'
import sectionsData from '../config/sections.json'

// Accent colours per section id
const SECTION_COLORS: Record<string, string> = {
  'hackathon': '#7C3AED',
  'actus-org': '#0EA5E9',
  'background-gpu': '#10B981',
  'technical': '#F59E0B',
  'actus-insurance': '#EC4899',
}

function getSectionFromSlug(slug: string): string {
  return slug.split('/')[0] || ''
}

function getSectionMeta(sectionId: string) {
  return sectionsData.find(s => s.id === sectionId)
}

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  initialSection?: string
}

export function SearchModal({ isOpen, onClose, initialSection }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [docsInitialized, setDocsInitialized] = useState(false)
  const [selectedSection, setSelectedSection] = useState<string>(initialSection ?? 'all')
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset section filter whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedSection(initialSection ?? 'all')
    }
  }, [isOpen, initialSection])

  // Initialize search index every time modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      setDocsInitialized(false)
      fetch('/api/docs?' + Date.now())
        .then(res => res.json())
        .then((docs: DocContent[]) => {
          initializeSearch(docs)
          setDocsInitialized(true)
          setIsLoading(false)
        })
        .catch(() => {
          setIsLoading(false)
        })
    }
  }, [isOpen])

  // Focus is handled by Dialog's initialFocus prop below

  // All unfiltered results (drives per-pill counts)
  const [allResults, setAllResults] = useState<SearchResult[]>([])

  // Slug-prefix set for fast "belongs to a known section" check
  const knownSectionIds = new Set(sectionsData.map(s => s.id))

  const belongsToKnownSection = (slug: string) => {
    const prefix = slug.split('/')[0]
    return knownSectionIds.has(prefix)
  }

  const filterBySection = (results: SearchResult[], section: string) =>
    section === 'all'
      ? results
      : results.filter(r =>
          r.item.metadata.slug.startsWith(section + '/') ||
          r.item.metadata.slug === section
        )

  // Re-run search when query changes — keep only docs that belong to a known section
  useEffect(() => {
    if (docsInitialized && query.trim()) {
      const raw = searchDocs(query)
      const all = raw.filter(r => belongsToKnownSection(r.item.metadata.slug))
      setAllResults(all)
      setResults(filterBySection(all, selectedSection))
    } else {
      setAllResults([])
      setResults([])
    }
  }, [query, docsInitialized])

  // Re-filter when section selection changes (without re-running search)
  useEffect(() => {
    if (allResults.length === 0 && !query.trim()) return
    setResults(filterBySection(allResults, selectedSection))
  }, [selectedSection, allResults])

  // Count per section from full result set
  const countForSection = (sectionId: string) =>
    allResults.filter(r =>
      r.item.metadata.slug.startsWith(sectionId + '/') ||
      r.item.metadata.slug === sectionId
    ).length

  const handleClose = () => {
    setQuery('')
    setResults([])
    onClose()
  }

  // Build a content snippet that shows the matching text in context
  const generatePreview = (content: string, searchQuery?: string): string => {
    const CONTEXT = 120
    const MAX = 280

    if (searchQuery && searchQuery.trim().length >= 2) {
      const q = searchQuery.trim().toLowerCase()
      const idx = content.toLowerCase().indexOf(q)
      if (idx !== -1) {
        const start = Math.max(0, idx - CONTEXT)
        const end = Math.min(content.length, idx + q.length + CONTEXT)
        return (start > 0 ? '…' : '') + content.substring(start, end) + (end < content.length ? '…' : '')
      }
    }

    if (content.length <= MAX) return content
    const cut = content.substring(0, MAX)
    const space = cut.lastIndexOf(' ')
    return (space > 0 ? cut.substring(0, space) : cut) + '…'
  }

  const activeSectionTitle = selectedSection === 'all'
    ? 'all documentation'
    : (getSectionMeta(selectedSection)?.shortTitle ?? selectedSection)

  return (
    <Dialog open={isOpen} onClose={handleClose} initialFocus={inputRef} className="relative z-50">
      <div className="fixed inset-0 bg-black bg-opacity-50" />

      <div className="fixed inset-0 overflow-y-auto p-4 sm:p-6 md:p-10">
        <Dialog.Panel
          className="mx-auto max-w-4xl transform overflow-hidden rounded-xl shadow-2xl ring-1 transition-all"
          style={{ backgroundColor: '#0D2038', borderColor: '#D4891A40' }}
        >
          {/* ── Search input ── */}
          <div className="relative" style={{ borderBottom: '1px solid #D4891A25' }}>
            <MagnifyingGlassIcon
              className="pointer-events-none absolute left-4 top-3.5 h-5 w-5"
              style={{ color: '#D4891A' }}
            />
            <input
              ref={inputRef}
              type="text"
              className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-sm focus:outline-none focus:ring-0"
              style={{ color: 'white' }}
              placeholder="Search documentation..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {/* ── Section filter pills ── */}
          <div
            className="flex flex-wrap items-center gap-2 px-4 py-2.5"
            style={{ borderBottom: '1px solid #D4891A20' }}
          >
            <button
              onClick={() => setSelectedSection('all')}
              className="flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors"
              style={{
                backgroundColor: selectedSection === 'all' ? '#D4891A' : '#152C44',
                color: selectedSection === 'all' ? '#0D2038' : '#9FB8D0',
                border: `1px solid ${selectedSection === 'all' ? '#D4891A' : '#D4891A30'}`,
              }}
            >
              All sections{allResults.length > 0 && <span className="ml-1.5 opacity-75">({allResults.length})</span>}
            </button>
            {sectionsData.map(section => {
              const active = selectedSection === section.id
              const color = SECTION_COLORS[section.id] ?? '#D4891A'
              const count = countForSection(section.id)
              return (
                <button
                  key={section.id}
                  onClick={() => setSelectedSection(section.id)}
                  className="flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: active ? color : '#152C44',
                    color: active ? '#fff' : count > 0 ? '#9FB8D0' : '#3A5470',
                    border: `1px solid ${active ? color : color + '40'}`,
                    opacity: !active && count === 0 && query.trim() ? 0.5 : 1,
                  }}
                >
                  {section.shortTitle}{count > 0 && <span className="ml-1.5 opacity-75">({count})</span>}
                </button>
              )
            })}
          </div>

          {/* ── States ── */}
          {isLoading && (
            <div className="px-6 py-12 text-center text-sm" style={{ color: '#9FB8D0' }}>
              Initializing search…
            </div>
          )}

          {!isLoading && !query.trim() && (
            <div className="px-6 py-12 text-center text-sm" style={{ color: '#9FB8D0' }}>
              Type to search <span style={{ color: '#D4891A' }}>{activeSectionTitle}</span>
            </div>
          )}

          {!isLoading && query.trim() && results.length === 0 && docsInitialized && (
            <div className="px-6 py-12 text-center text-sm" style={{ color: '#9FB8D0' }}>
              No results for &ldquo;<span className="text-white">{query}</span>&rdquo;
              {selectedSection !== 'all' && (
                <>
                  {' '}in <span style={{ color: '#D4891A' }}>{activeSectionTitle}</span>
                  {' — '}
                  <button
                    className="underline"
                    style={{ color: '#D4891A' }}
                    onClick={() => setSelectedSection('all')}
                  >
                    search all sections
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── Results ── */}
          {results.length > 0 && (
            <>
              <div className="px-5 pt-3 pb-1 text-xs" style={{ color: '#4A6580' }}>
                {results.length} result{results.length !== 1 ? 's' : ''}
                {selectedSection !== 'all' && (
                  <> in <span style={{ color: SECTION_COLORS[selectedSection] ?? '#D4891A' }}>{activeSectionTitle}</span></>
                )}
              </div>
              <ul className="max-h-[540px] scroll-py-2 overflow-y-auto pb-2 text-sm">
                {results.map((result, index) => {
                  const sectionId = getSectionFromSlug(result.item.metadata.slug)
                  const sectionMeta = getSectionMeta(sectionId)
                  const sectionColor = SECTION_COLORS[sectionId] ?? '#D4891A'

                  return (
                    <li key={`${result.item.metadata.slug}-${index}`}>
                      <Link
                        href={`/docs/${result.item.metadata.slug}`}
                        className="block cursor-pointer select-none px-5 py-4 transition-colors"
                        style={{ borderTop: '1px solid #D4891A15' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#132438')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                        onClick={handleClose}
                      >
                        {/* Title row */}
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3
                            className="font-semibold text-base text-white"
                            dangerouslySetInnerHTML={{
                              __html: highlightMatch(
                                result.item.metadata.title,
                                result.matches?.filter(m => m.key === 'metadata.title'),
                                query
                              ),
                            }}
                          />
                          {/* Occurrence count badge */}
                          {result.occurrences != null && result.occurrences > 0 && (
                            <span
                              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium flex-shrink-0"
                              style={{ backgroundColor: '#1A3550', color: '#6A9FC0', border: '1px solid #2A4F70' }}
                              title={`"${query}" found ${result.occurrences} time${result.occurrences !== 1 ? 's' : ''} in this document`}
                            >
                              ×{result.occurrences}
                            </span>
                          )}
                          {/* Section badge */}
                          <span
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium flex-shrink-0"
                            style={{
                              backgroundColor: sectionColor + '22',
                              color: sectionColor,
                              border: `1px solid ${sectionColor}50`,
                            }}
                          >
                            {sectionMeta?.shortTitle ?? sectionId}
                          </span>
                        </div>

                        {/* Description */}
                        {result.item.metadata.description && (
                          <p
                            className="mb-1.5 text-sm"
                            style={{ color: '#BDD0E0' }}
                            dangerouslySetInnerHTML={{
                              __html: highlightMatch(
                                result.item.metadata.description,
                                result.matches?.filter(m => m.key === 'metadata.description'),
                                query
                              ),
                            }}
                          />
                        )}

                        {/* Content snippet */}
                        <p
                          className="text-xs leading-relaxed"
                          style={{ color: '#6A8BA8' }}
                          dangerouslySetInnerHTML={{
                            __html: highlightMatch(
                              generatePreview(result.item.content, query),
                              result.matches?.filter(m => m.key === 'content'),
                              query
                            ),
                          }}
                        />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}