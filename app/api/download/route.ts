import { NextRequest, NextResponse } from 'next/server'

// Only proxy downloads from Vercel Blob storage to prevent SSRF abuse
const ALLOWED_HOSTNAME_SUFFIX = '.public.blob.vercel-storage.com'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const url = searchParams.get('url')
  const filename = searchParams.get('filename') ?? 'download'

  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return new NextResponse('Invalid url parameter', { status: 400 })
  }

  if (!parsed.hostname.endsWith(ALLOWED_HOSTNAME_SUFFIX)) {
    return new NextResponse('URL not allowed', { status: 403 })
  }

  const upstream = await fetch(url)
  if (!upstream.ok) {
    return new NextResponse('Failed to fetch resource', { status: 502 })
  }

  const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream'
  const safeFilename = filename.replace(/[^a-zA-Z0-9._\- ]/g, '_')

  return new NextResponse(upstream.body, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${safeFilename}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
