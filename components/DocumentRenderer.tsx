'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import { DocContent } from '../lib/markdown'
import 'highlight.js/styles/github-dark.css'
import { TableOfContents } from './TableOfContents'
import { MermaidChart } from './MermaidChart'
import { useLayout } from './LayoutContext'
import { ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/outline'

interface DocumentRendererProps {
  doc: DocContent
}

/**
 * Resolve a possibly-relative markdown link to an absolute /docs/... path.
 * Handles:
 *   ./domain-model.md  →  /docs/{folder}/domain-model
 *   ./modules/contracts.md  →  /docs/{folder}/modules/contracts
 *   ../other-section/page  →  /docs/other-section/page
 *   plain-name (no ./ or .md)  →  /docs/{folder}/plain-name
 */
function resolveDocLink(href: string, fileDir: string): string {
  if (!href) return href
  // Leave external URLs, absolute paths, anchors, and mailto alone
  if (href.startsWith('http') || href.startsWith('/') || href.startsWith('#') || href.startsWith('mailto:')) {
    return href
  }

  // Strip .md extension
  let rel = href.replace(/\.md$/i, '')

  // Treat README (without extension) as the directory itself
  rel = rel.replace(/\/README$/i, '').replace(/^README$/i, '.')

  // Use the actual directory of the source file for resolution
  // fileDir is e.g. 'financial', 'financial/modules', or '' for root files
  const baseParts = fileDir ? fileDir.split('/') : []

  // Walk the relative segments
  const relParts = rel.split('/')
  const resultParts = [...baseParts]
  for (const part of relParts) {
    if (part === '..') {
      resultParts.pop()
    } else if (part !== '.' && part !== '') {
      resultParts.push(part)
    }
  }

  return `/docs/${resultParts.join('/')}`
}

export function DocumentRenderer({ doc }: DocumentRendererProps) {
  const { isTocCollapsed, setTocCollapsed } = useLayout()
  // Pre-generate unique IDs from content to ensure server/client consistency
  const headingIds = React.useMemo(() => {
    const headingRegex = /^(#{1,6})\s+(.+?)$/gm
    const usedIds = new Set<string>()
    const idMap = new Map<string, string>()
    let match

    while ((match = headingRegex.exec(doc.content)) !== null) {
      const rawText = match[2].trim()
      const cleanText = rawText
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
        .replace(/\*(.*?)\*/g, '$1') // Remove italic
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Extract link text
        .replace(/`(.*?)`/g, '$1') // Remove inline code
        .trim()
      
      const baseId = cleanText
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .toLowerCase()
        .trim()
      
      let uniqueId = baseId
      let counter = 1
      
      // Ensure unique ID by appending counter if needed
      while (usedIds.has(uniqueId)) {
        uniqueId = `${baseId}-${counter}`
        counter++
      }
      
      usedIds.add(uniqueId)
      idMap.set(cleanText, uniqueId)
    }

    return idMap
  }, [doc.content])

  // Helper function to get the unique ID for a heading text
  const getHeadingId = (text: string): string => {
    const plainText = typeof text === 'string' ? text : String(text)
    const cleanText = plainText
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Extract link text
      .replace(/`(.*?)`/g, '$1') // Remove inline code
      .trim()
    
    return headingIds.get(cleanText) || cleanText
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .trim()
  }

  return (
    <div className="flex gap-8 max-w-none">
      {/* Main content */}
      <div className="flex-1 min-w-0 pl-8 pr-4 py-8 sm:pl-12 lg:pl-16">
      {/* Header */}
      <div className="mb-8 border-b border-gray-200 pb-8 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              {doc.metadata.title}
            </h1>
            {doc.metadata.description && (
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                {doc.metadata.description}
              </p>
            )}
          </div>
          {doc.metadata.category && (
            <div className="flex-shrink-0">
              <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-0.5 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {doc.metadata.category}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="prose prose-lg prose-blue max-w-none dark:prose-invert">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight, rehypeRaw]}
          components={{
            // Custom link rendering for internal links
            a: ({ node, href, children, ...props }) => {
              const resolvedHref = resolveDocLink(href || '', doc.metadata.fileDir ?? '')
              if (resolvedHref && (resolvedHref.startsWith('/') || resolvedHref.startsWith('#'))) {
                return (
                  <a href={resolvedHref} {...props} className="text-blue-600 dark:text-blue-400 hover:underline">
                    {children}
                  </a>
                )
              }
              return (
                <a href={resolvedHref} {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                  {children}
                </a>
              )
            },
            // Code blocks: mermaid → diagram, everything else → syntax-highlighted block
            code: ({ node, className, children, ...props }) => {
              const inline = !(node?.position?.start.line !== node?.position?.end.line || String(children).includes('\n'))
              const language = (className || '').replace(/.*language-/, '')

              if (!inline && language === 'mermaid') {
                const chart = String(children).replace(/\n$/, '')
                return <MermaidChart chart={chart} />
              }

              if (inline) {
                return (
                  <code className="bg-gray-100 dark:bg-gray-800 text-pink-600 dark:text-pink-400 rounded px-1.5 py-0.5 text-sm font-mono">
                    {children}
                  </code>
                )
              }

              // Block code: wrap in a styled container, pass hljs className through for colors
              return (
                <div className="not-prose my-4 rounded-lg overflow-hidden border border-gray-700">
                  {language && language !== 'mermaid' && (
                    <div className="bg-gray-800 px-4 py-1.5 text-xs text-gray-400 font-mono border-b border-gray-700">
                      {language}
                    </div>
                  )}
                  <pre className="bg-gray-900 p-4 overflow-x-auto m-0 rounded-none">
                    <code className={`${className || ''} text-sm leading-relaxed`}>
                      {children}
                    </code>
                  </pre>
                </div>
              )
            },
            // Transparent passthrough — styling is handled entirely in the code renderer above
            pre: ({ node, children }) => <>{children}</>,
            // Enhanced tables
            table: ({ node, children, ...props }) => (
              <div className="overflow-x-auto my-4">
                <table {...props} className="border-collapse border border-gray-300 dark:border-gray-600 w-full">
                  {children}
                </table>
              </div>
            ),
            // Add IDs to headings for TOC navigation
            h1: ({ node, children, ...props }) => {
              const text = Array.isArray(children) 
                ? children.map(child => typeof child === 'string' ? child : '').join(' ')
                : String(children || '')
              const id = getHeadingId(text)
              return <h1 {...props} id={id}>{children}</h1>
            },
            h2: ({ node, children, ...props }) => {
              const text = Array.isArray(children) 
                ? children.map(child => typeof child === 'string' ? child : '').join(' ')
                : String(children || '')
              const id = getHeadingId(text)
              return <h2 {...props} id={id}>{children}</h2>
            },
            h3: ({ node, children, ...props }) => {
              const text = Array.isArray(children) 
                ? children.map(child => typeof child === 'string' ? child : '').join(' ')
                : String(children || '')
              const id = getHeadingId(text)
              return <h3 {...props} id={id}>{children}</h3>
            },
            h4: ({ node, children, ...props }) => {
              const text = Array.isArray(children) 
                ? children.map(child => typeof child === 'string' ? child : '').join(' ')
                : String(children || '')
              const id = getHeadingId(text)
              return <h4 {...props} id={id}>{children}</h4>
            },
            h5: ({ node, children, ...props }) => {
              const text = Array.isArray(children) 
                ? children.map(child => typeof child === 'string' ? child : '').join(' ')
                : String(children || '')
              const id = getHeadingId(text)
              return <h5 {...props} id={id}>{children}</h5>
            },
            h6: ({ node, children, ...props }) => {
              const text = Array.isArray(children) 
                ? children.map(child => typeof child === 'string' ? child : '').join(' ')
                : String(children || '')
              const id = getHeadingId(text)
              return <h6 {...props} id={id}>{children}</h6>
            },
          }}
        >
          {doc.content}
        </ReactMarkdown>
      </div>

        {/* Footer Navigation */}
        <div className="mt-8 border-t border-gray-200 pt-4 dark:border-gray-800">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div>
              Category: {doc.metadata.category || 'General'}
            </div>
            <div>
              Maintained by Frans van Ek © 2026
            </div>
          </div>
        </div>
      </div>
      
      {/* Table of Contents */}
      <div className={`hidden xl:flex flex-col flex-shrink-0 py-8 transition-all duration-300 ${isTocCollapsed ? 'w-6 pr-0' : 'w-64 pr-8'}`}>
        {/* Fixed toggle button always at 40% of screen height on the right edge */}
        <button
          onClick={() => setTocCollapsed(!isTocCollapsed)}
          className="fixed z-50 -translate-y-1/2 flex items-center justify-center rounded-l-md transition-opacity opacity-30 hover:opacity-100"
          style={{ top: '40%', right: '0', backgroundColor: '#e5e7eb', color: '#6b7280', width: '16px', height: '48px', borderLeft: '1px solid #d1d5db', borderTop: '1px solid #d1d5db', borderBottom: '1px solid #d1d5db' }}
          title={isTocCollapsed ? 'Expand table of contents' : 'Collapse table of contents'}
        >
          {isTocCollapsed
            ? <ChevronLeftIcon className="h-3 w-3" />
            : <ChevronRightIcon className="h-3 w-3" />
          }
        </button>
        {!isTocCollapsed && (
          <div className="sticky top-8">
            <TableOfContents content={doc.content} />
          </div>
        )}
      </div>
    </div>
  )
}