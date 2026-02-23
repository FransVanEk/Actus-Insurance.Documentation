import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const docsDirectory = path.join(process.cwd(), 'docs')

/**
 * Fill in any missing frontmatter fields by inferring from file path and content.
 * - title: first H1 heading, or filename without extension
 * - category: name of the immediate parent folder (capitalized), or 'General' if in root
 * - order: defaults to 999
 */
function inferMissingMetadata(data: Record<string, unknown>, content: string, filePath: string, slug: string): DocMetadata {
  let title = (data.title as string) || ''
  if (!title) {
    const h1Match = content.match(/^#\s+(.+?)$/m)
    title = h1Match
      ? h1Match[1].trim().replace(/[*_`]/g, '')
      : path.basename(filePath, '.md').replace(/README/i, 'Index')
  }

  let category = (data.category as string) || ''
  if (!category) {
    const relativePath = path.relative(docsDirectory, filePath).replace(/\\/g, '/')
    const parts = relativePath.split('/')
    if (parts.length > 1) {
      // Use the immediate parent folder name, capitalized
      const folder = parts[0]
      category = folder.charAt(0).toUpperCase() + folder.slice(1)
    } else {
      category = 'General'
    }
  }

  return {
    ...data,
    title,
    category,
    order: (data.order as number) ?? 999,
    slug,
  } as DocMetadata
}

export interface DocMetadata {
  title: string
  description?: string
  category?: string
  parent?: string
  order?: number
  slug: string
  /** Directory of the file relative to the docs root (e.g. 'financial'). Used for resolving relative links. */
  fileDir: string
}

export interface DocContent {
  metadata: DocMetadata
  content: string
}

export function getAllDocSlugs(): string[] {
  const allFiles = getAllMarkdownFiles(docsDirectory)
  const slugs = allFiles.map(filePath => {
    const relativePath = path.relative(docsDirectory, filePath).replace(/\\/g, '/')
    let slug = relativePath.replace(/\.md$/, '')
    // Treat README as the directory index (same as index.md)
    slug = slug.replace(/(?:^|\/)README$/i, (m) => m.replace(/README$/i, 'index'))
    // Deduplicate: if both index.md and README.md exist, README resolves to same slug
    return slug
  })
  // Remove duplicates (e.g. both index.md and README.md in same folder)
  return [...new Set(slugs)]
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
  // Normalise: treat trailing /index as the bare directory slug
  const normSlug = slug.replace(/\/index$/, '') || 'index'

  let fullPath = path.join(docsDirectory, `${normSlug}.md`)

  // Fallback chain: {slug}.md → {slug}/index.md → {slug}/README.md
  if (!fs.existsSync(fullPath)) {
    fullPath = path.join(docsDirectory, normSlug, 'index.md')
  }
  if (!fs.existsSync(fullPath)) {
    fullPath = path.join(docsDirectory, normSlug, 'README.md')
  }
  // Also handle upper-case README
  if (!fs.existsSync(fullPath)) {
    fullPath = path.join(docsDirectory, normSlug, 'Readme.md')
  }

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Document not found: ${slug}`)
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(fileContents)

  // Compute the directory containing the file, relative to docsDirectory.
  // e.g. financial/index.md → 'financial', financial/contracts.md → 'financial', index.md → ''
  const fileDir = path.relative(docsDirectory, path.dirname(fullPath))
    .replace(/\\/g, '/')
    .replace(/^\.$/, '')

  return {
    metadata: { ...inferMissingMetadata(data as Record<string, unknown>, content, fullPath, normSlug), fileDir },
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
      // Resolve slug → file, same fallback logic as getDocBySlug
      let fullPath = path.join(docsDirectory, `${slug}.md`)
      if (!fs.existsSync(fullPath)) fullPath = path.join(docsDirectory, slug, 'index.md')
      if (!fs.existsSync(fullPath)) fullPath = path.join(docsDirectory, slug, 'README.md')
      if (!fs.existsSync(fullPath)) return

      const fileContents = fs.readFileSync(fullPath, 'utf8')
      const { data, content } = matter(fileContents)
      const inferred = inferMissingMetadata(data as Record<string, unknown>, content, fullPath, slug)

      const category = inferred.category || 'General'
      const title = inferred.title || slug
      const order = inferred.order || 999
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