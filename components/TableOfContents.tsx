'use client'

import React, { useEffect, useState } from 'react'

interface TocItem {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  content: string
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [tocItems, setTocItems] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [isManualClick, setIsManualClick] = useState(false)

  useEffect(() => {
    // Strip fenced code blocks before extracting headings so that
    // comment lines like "# Register your application" inside ```bash
    // blocks are not mistaken for markdown headings.
    const contentWithoutCode = content.replace(/^```[\s\S]*?^```/gm, '')

    // Extract headings from markdown content
    const headingRegex = /^(#{1,6})\s+(.+?)$/gm
    const items: TocItem[] = []
    const usedIds = new Set<string>()
    let match

    while ((match = headingRegex.exec(contentWithoutCode)) !== null) {
      const level = match[1].length
      // Clean the text by removing markdown formatting
      const rawText = match[2].trim()
      const cleanText = rawText
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
        .replace(/\*(.*?)\*/g, '$1') // Remove italic
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Extract link text
        .replace(/`(.*?)`/g, '$1') // Remove inline code
        .trim()
      
      const baseId = generateId(cleanText)
      let uniqueId = baseId
      let counter = 1
      
      // Ensure unique ID by appending counter if needed
      while (usedIds.has(uniqueId)) {
        uniqueId = `${baseId}-${counter}`
        counter++
      }
      
      usedIds.add(uniqueId)
      
      items.push({
        id: uniqueId,
        text: cleanText,
        level
      })
    }

    setTocItems(items)
  }, [content])

  useEffect(() => {
    // Create intersection observer to highlight active section
    let timeoutId: NodeJS.Timeout
    
    const observer = new IntersectionObserver(
      (entries) => {
        // Don't auto-update if user just clicked something
        if (isManualClick) {
          return
        }
        
        // Clear any existing timeout
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        
        // Add a small delay to prevent rapid switching
        timeoutId = setTimeout(() => {
          // Find the entry that's most visible or the first intersecting one
          const intersectingEntries = entries.filter(entry => entry.isIntersecting)
          
          if (intersectingEntries.length > 0) {
            // Sort by intersection ratio and position (topmost wins in ties)
            const sortedEntries = intersectingEntries.sort((a, b) => {
              if (Math.abs(a.intersectionRatio - b.intersectionRatio) < 0.1) {
                // If ratios are similar, prefer the one higher on the page
                return a.boundingClientRect.top - b.boundingClientRect.top
              }
              return b.intersectionRatio - a.intersectionRatio
            })
            
            setActiveId(sortedEntries[0].target.id)
          }
        }, 100)
      },
      {
        rootMargin: '-10% 0% -60% 0%',
        threshold: [0, 0.25, 0.5, 0.75, 1.0]
      }
    )

    // Observe all headings that actually exist in the DOM
    const headingElements = document.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]')
    headingElements.forEach((element) => {
      observer.observe(element)
    })

    return () => {
      observer.disconnect()
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [tocItems, isManualClick])

  const generateId = (text: string): string => {
    return text
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .toLowerCase()
      .trim()
  }

  const handleClick = (id: string) => {
    // Immediately set the active item
    setActiveId(id)
    // Disable intersection observer for a short time
    setIsManualClick(true)
    
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }
    
    // Re-enable intersection observer after scrolling is done
    setTimeout(() => {
      setIsManualClick(false)
    }, 1500) // Longer timeout to ensure scrolling is complete
  }

  if (tocItems.length === 0) {
    return null
  }

  return (
    <div className="sticky top-8 space-y-1">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
        On this page
      </h3>
      <nav className="space-y-1">
        {tocItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleClick(item.id)}
            className={`block w-full text-left text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
              activeId === item.id
                ? 'text-blue-600 dark:text-blue-400 font-medium'
                : 'text-gray-600 dark:text-gray-300'
            }`}
            style={{
              paddingLeft: `${(item.level - 1) * 12}px`,
            }}
          >
            {item.text}
          </button>
        ))}
      </nav>
    </div>
  )
}