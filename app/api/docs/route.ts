import { NextResponse } from 'next/server'
import { getAllDocs } from '../../../lib/markdown'
import removeMd from 'remove-markdown'

// Convert markdown content to clean plain text for search indexing
function markdownToPlainText(content: string): string {
  // Use remove-markdown to properly convert markdown to plain text
  const plainText = removeMd(content, {
    stripListLeaders: true, // Remove list leaders (*, 1., etc.)
    listUnicodeChar: '', // Don't replace with unicode
    gfm: true, // Support GitHub Flavored Markdown
    useImgAltText: true, // Use alt text for images
  })
  
  // Clean up any remaining whitespace
  return plainText
    .replace(/\n\s*\n/g, ' ') // Replace multiple newlines with space
    .replace(/\n/g, ' ') // Replace remaining newlines with space
    .replace(/\s+/g, ' ') // Normalize whitespace
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