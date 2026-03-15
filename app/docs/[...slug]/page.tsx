import React from 'react'
import { notFound } from 'next/navigation'
import { getDocBySlug, getAllDocSlugs } from '../../../lib/markdown'
import { DocumentRenderer } from '../../../components/DocumentRenderer'

interface DocsPageProps {
  params: Promise<{
    slug?: string[]
  }>
}

// Generate static params for all documentation pages
export async function generateStaticParams() {
  const slugs = getAllDocSlugs()
  
  return slugs.map((slug) => ({
    slug: slug.split('/'),
  }))
}

export default async function DocsPage({ params }: DocsPageProps) {
  const resolvedParams = await params
  const slug = resolvedParams.slug?.join('/') || 'index'
  
  try {
    const doc = await getDocBySlug(slug)
    return <DocumentRenderer doc={doc} />
  } catch (error) {
    notFound()
  }
}