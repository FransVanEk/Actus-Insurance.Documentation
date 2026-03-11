import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

const docsDirectory = path.join(process.cwd(), 'docs')

const MIME: Record<string, string> = {
  svg:  'image/svg+xml',
  png:  'image/png',
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  gif:  'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params
  // Reconstruct the relative path and resolve it safely inside docs/
  const rel  = slug.join('/')
  const full = path.resolve(docsDirectory, rel)

  // Security: ensure the resolved path stays inside the docs directory
  if (!full.startsWith(docsDirectory + path.sep) && full !== docsDirectory) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  try {
    const buf = await fs.readFile(full)
    const ext = path.extname(full).slice(1).toLowerCase()
    const contentType = MIME[ext] ?? 'application/octet-stream'
    return new NextResponse(buf, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch {
    return new NextResponse('Not Found', { status: 404 })
  }
}
