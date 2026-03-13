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
    if (tocItems.length === 0) return

    let rafId: number

    const onScroll = () => {
      if (isManualClick) return
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const headings = Array.from(
          document.querySelectorAll<HTMLElement>('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]')
        )
        if (headings.length === 0) return

        // At (or very near) the bottom of the page → activate the last heading
        const scrollBottom = window.scrollY + window.innerHeight
        const pageHeight = document.documentElement.scrollHeight
        if (pageHeight - scrollBottom < 8) {
          setActiveId(headings[headings.length - 1].id)
          return
        }

        // Otherwise: last heading whose top edge is at or above 30% down the viewport
        const threshold = window.scrollY + window.innerHeight * 0.3
        let active = headings[0]
        for (const h of headings) {
          if (h.offsetTop <= threshold) {
            active = h
          } else {
            break
          }
        }
        setActiveId(active.id)
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll() // initialise on mount

    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafId)
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
      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-amber-light)' }}>
        On this page
      </h3>
      <nav className="space-y-1">
        {tocItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleClick(item.id)}
            className={`block w-full text-left text-sm transition-colors ${
              activeId === item.id
                ? 'font-medium'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
            style={{
              paddingLeft: `${(item.level - 1) * 12}px`,
              ...(activeId === item.id ? { color: 'var(--color-amber-light)' } : {}),
            }}
          >
            {item.text}
          </button>
        ))}
      </nav>
    </div>
  )
}