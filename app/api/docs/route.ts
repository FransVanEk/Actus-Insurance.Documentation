import { NextResponse } from 'next/server'
import { getAllDocs } from '../../../lib/markdown'
import removeMd from 'remove-markdown'

// Convert markdown content to clean plain text for search indexing
function markdownToPlainText(content: string): string {
  let text = content

  // Strip YAML frontmatter
  text = text.replace(/^---[\s\S]*?---\s*/m, '')

  // Strip fenced code blocks entirely (``` or ~~~)
  text = text.replace(/```[\s\S]*?```/g, ' ')
  text = text.replace(/~~~[\s\S]*?~~~/g, ' ')

  // Strip HTML tags
  text = text.replace(/<[^>]+>/g, ' ')

  // Strip table separator rows (e.g. |---|---|)
  text = text.replace(/^\|[-| :]+\|.*$/gm, '')

  // Strip table cell pipes — turn "| foo | bar |" into "foo bar"
  text = text.replace(/\|/g, ' ')

  // Strip setext-style heading underlines (=== or ---)
  text = text.replace(/^[=\-]{2,}\s*$/gm, '')

  // Use remove-markdown for the rest (links, images, bold, italic, headings, lists…)
  const plainText = removeMd(text, {
    stripListLeaders: true,
    listUnicodeChar: '',
    gfm: true,
    useImgAltText: true,
  })

  // Strip any leftover backticks, asterisks, underscores, tildes, angle brackets
  return plainText
    .replace(/[`*_~>#]/g, '')
    .replace(/\[|\]|\(|\)/g, ' ')
    .replace(/\n\s*\n/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function GET() {
  try {
    const docs = await getAllDocs()
    
    // Convert markdown content to plain text for search indexing
    const searchableDocs = docs.map(doc => {
      const plainTextContent = markdownToPlainText(doc.content)
      
      return {
        ...doc,
        content: plainTextContent
      }
    })
    
    return NextResponse.json(searchableDocs)
  } catch (error) {
    console.error('Error fetching docs:', error)
    return NextResponse.json({ error: 'Failed to fetch documentation' }, { status: 500 })
  }
}