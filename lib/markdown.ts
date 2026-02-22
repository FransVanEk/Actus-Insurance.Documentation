import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const docsDirectory = path.join(process.cwd(), 'docs')

export interface DocMetadata {
  title: string
  description?: string
  category?: string
  parent?: string
  order?: number
  slug: string
}

export interface DocContent {
  metadata: DocMetadata
  content: string
}

export function getAllDocSlugs(): string[] {
  const allFiles = getAllMarkdownFiles(docsDirectory)
  return allFiles.map(filePath => {
    const relativePath = path.relative(docsDirectory, filePath)
    return relativePath.replace(/\.md$/, '').replace(/\\/g, '/')
  })
}

function getAllMarkdownFiles(dir: string): string[] {
  let results: string[] = []
  const list = fs.readdirSync(dir)
  
  list.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllMarkdownFiles(filePath))
    } else if (file.endsWith('.md')) {
      results.push(filePath)
    }
  })
  
  return results
}

export async function getDocBySlug(slug: string): Promise<DocContent> {
  let fullPath = path.join(docsDirectory, `${slug}.md`)
  
  // If direct file doesn't exist, try looking for index.md in subdirectory
  if (!fs.existsSync(fullPath)) {
    fullPath = path.join(docsDirectory, slug, 'index.md')
  }
  
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Document not found: ${slug}`)
  }
  
  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(fileContents)
  
  return {
    metadata: {
      ...data,
      slug,
    } as DocMetadata,
    content,
  }
}

export async function getAllDocs(): Promise<DocContent[]> {
  const slugs = getAllDocSlugs()
  const docs = await Promise.all(
    slugs.map(slug => getDocBySlug(slug))
  )
  
  // Sort by category and order
  return docs.sort((a, b) => {
    if (a.metadata.category !== b.metadata.category) {
      return (a.metadata.category || 'zzz').localeCompare(b.metadata.category || 'zzz')
    }
    return (a.metadata.order || 999) - (b.metadata.order || 999)
  })
}

export function getDocNavigation() {
  const slugs = getAllDocSlugs()
  const allItems: Array<{ title: string; slug: string; order: number; parent?: string; category: string }> = []
  
  // First pass: collect all items
  slugs.forEach(slug => {
    try {
      const fullPath = path.join(docsDirectory, `${slug}.md`)
      const fileContents = fs.readFileSync(fullPath, 'utf8')
      const { data } = matter(fileContents)
      
      const category = data.category || 'General'
      const title = data.title || slug
      const order = data.order || 999
      const parent = data.parent
      
      allItems.push({ title, slug, order, parent, category })
    } catch (error) {
    }
  })
  
  // Second pass: build hierarchical structure
  const navigation: { [category: string]: Array<{ title: string; slug: string; order: number; parent?: string; children?: any[] }> } = {}
  
  // Group by category first
  const itemsByCategory: { [category: string]: typeof allItems } = {}
  allItems.forEach(item => {
    if (!itemsByCategory[item.category]) {
      itemsByCategory[item.category] = []
    }
    itemsByCategory[item.category].push(item)
  })
  
  // Build hierarchy within each category
  Object.keys(itemsByCategory).forEach(category => {
    const categoryItems = itemsByCategory[category]
    const itemsMap = new Map(categoryItems.map(item => [item.slug, { ...item, children: [] as any[] }]))
    const rootItems: any[] = []
    
    // Sort all items by order first
    categoryItems.sort((a, b) => a.order - b.order)
    
    categoryItems.forEach(item => {
      const itemWithChildren = itemsMap.get(item.slug)!
      
      if (item.parent) {
        const parentItem = itemsMap.get(item.parent)
        if (parentItem) {
          parentItem.children.push(itemWithChildren)
        } else {
          // Parent not found, treat as root item
          rootItems.push(itemWithChildren)
        }
      } else {
        rootItems.push(itemWithChildren)
      }
    })
    
    // Sort children within each parent
    const sortChildren = (items: any[]) => {
      items.forEach(item => {
        if (item.children.length > 0) {
          item.children.sort((a: any, b: any) => a.order - b.order)
          sortChildren(item.children)
        }
      })
    }
    
    sortChildren(rootItems)
    navigation[category] = rootItems
  })
  
  return navigation
}