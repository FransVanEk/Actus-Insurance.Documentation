'use client'

import React, { useState, useRef, useMemo } from 'react'
import { Dialog } from '@headlessui/react'
import {
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  DocumentTextIcon,
  PresentationChartBarIcon,
  FilmIcon,
  TableCellsIcon,
  DocumentIcon,
  XMarkIcon,
  EyeIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import allResources from '../config/resources.json'

export interface Resource {
  id: string
  title: string
  description: string
  type: 'pdf' | 'powerpoint' | 'video' | 'excel' | 'word' | 'zip' | 'json' | 'other'
  size: string
  url: string
  /** Optional URL for opening in a viewer modal or new tab. */
  viewUrl?: string
}

const TYPE_META: Record<
  Resource['type'],
  { label: string; color: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }
> = {
  pdf:         { label: 'PDF',        color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',        icon: DocumentTextIcon },
  powerpoint:  { label: 'PowerPoint', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', icon: PresentationChartBarIcon },
  video:       { label: 'Video',      color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', icon: FilmIcon },
  excel:       { label: 'Excel',      color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',  icon: TableCellsIcon },
  word:        { label: 'Word',       color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',     icon: DocumentTextIcon },
  zip:         { label: 'ZIP',        color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',        icon: DocumentIcon },
  json:        { label: 'JSON',       color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300', icon: DocumentTextIcon },
  other:       { label: 'File',       color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',        icon: DocumentIcon },
}

/** Types that can be previewed inline in the modal */
const PREVIEWABLE: Resource['type'][] = ['video', 'pdf']

/** For cross-origin URLs (e.g. Vercel Blob) the browser ignores the `download`
 *  attribute and opens the file in a new tab instead. Route those through our
 *  server-side proxy so the browser always gets a download disposition. */
function downloadHref(url: string, title: string): string {
  // Absolute URLs are cross-origin — proxy them so the browser triggers a download
  // instead of opening in a new tab. This check is consistent on both server and client.
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(title)}`
  }
  return url
}

// ─── Media Modal ─────────────────────────────────────────────────────────────

interface MediaModalProps {
  resource: Resource | null
  onClose: () => void
}

function MediaModal({ resource, onClose }: MediaModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  if (!resource) return null

  const handleClose = () => {
    // Pause video on close so audio doesn't keep playing
    videoRef.current?.pause()
    onClose()
  }

  return (
    <Dialog open={!!resource} onClose={handleClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-xl shadow-2xl"
          style={{ backgroundColor: '#0D2038', border: '1px solid #D4891A40', maxHeight: '90vh' }}>

          {/* Header */}
          <div className="flex items-start justify-between gap-4 px-6 py-4 flex-shrink-0"
            style={{ borderBottom: '1px solid #D4891A25' }}>
            <div className="min-w-0">
              <Dialog.Title className="text-base font-semibold text-white truncate">
                {resource.title}
              </Dialog.Title>
              {resource.description && (
                <p className="mt-0.5 text-sm" style={{ color: '#9FB8D0' }}>
                  {resource.description}
                </p>
              )}
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              {/* Open in new tab */}
              <a
                href={resource.viewUrl || resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                style={{ border: '1px solid #D4891A40', color: '#D4891A' }}
              >
                <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                Open in tab
              </a>
              {/* Download */}
              <a
                href={downloadHref(resource.url, resource.title)}
                download
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors"
                style={{ backgroundColor: '#D4891A' }}
              >
                <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                Download
              </a>
              {/* Close */}
              <button
                onClick={handleClose}
                className="rounded-lg p-1.5 transition-colors hover:bg-white/10"
                style={{ color: '#9FB8D0' }}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-auto min-h-0">
            {resource.type === 'video' && (
              <div className="flex items-center justify-center bg-black p-0">
                <video
                  ref={videoRef}
                  src={resource.viewUrl || resource.url}
                  controls
                  autoPlay={false}
                  className="w-full max-h-[70vh]"
                  style={{ display: 'block' }}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}

            {resource.type === 'pdf' && (
              <iframe
                src={resource.viewUrl || resource.url}
                title={resource.title}
                className="w-full"
                style={{ height: '70vh', border: 'none', display: 'block' }}
              />
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}

// ─── ResourceItem ─────────────────────────────────────────────────────────────
// A compact, inline-friendly single resource entry.
// Priority: video → Watch modal | pdf → Preview modal | other → Download link.
// The root element gets  id={resource.id}  so you can deep-link to it.

interface ResourceItemProps {
  /** Resource id from resources.json, or a full Resource object. */
  id: string
  /** When true the description is hidden (default: shown). */
  hideDescription?: boolean
  /** Minimal mode: icon + title only. Click row to open preview or download. */
  minimal?: boolean
}

export function ResourceItem({ id, hideDescription = false, minimal = false }: ResourceItemProps) {
  const [previewResource, setPreviewResource] = useState<Resource | null>(null)

  const resource = (allResources as Resource[]).find(r => r.id === id)
  if (!resource) return null

  const meta    = TYPE_META[resource.type] ?? TYPE_META.other
  const Icon    = meta.icon
  const canOpen = PREVIEWABLE.includes(resource.type) && !!(resource.viewUrl || resource.url)

  if (minimal) {
    const minimalClassName =
      'not-prose inline-flex max-w-full items-center gap-2 rounded-md border border-[#D4891A50] bg-[#1A3550]/80 px-2.5 py-1.5 text-left backdrop-blur-sm transition-all hover:border-[#D4891A] hover:bg-[#1A3550] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4891A]'

    const minimalContent = (
      <>
        <div
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded"
          style={{ backgroundColor: '#0D2038' }}
        >
          <Icon className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="truncate text-xs font-semibold text-white sm:text-sm">{resource.title}</span>
      </>
    )

    return (
      <>
        {canOpen ? (
          <button
            id={resource.id}
            type="button"
            onClick={() => setPreviewResource(resource)}
            className={minimalClassName}
          >
            {minimalContent}
          </button>
        ) : (
          <a
            id={resource.id}
            href={downloadHref(resource.url, resource.title)}
            download
            className={minimalClassName}
          >
            {minimalContent}
          </a>
        )}

        <MediaModal resource={previewResource} onClose={() => setPreviewResource(null)} />
      </>
    )
  }

  // Decide primary action label + handler
  let primaryLabel: string
  let primaryIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  let primaryAction: React.ReactNode

  if (resource.type === 'video' && canOpen) {
    primaryLabel = 'Watch'
    primaryIcon  = FilmIcon
    primaryAction = (
      <button
        onClick={() => setPreviewResource(resource)}
        className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-white transition-colors"
        style={{ backgroundColor: '#D4891A' }}
      >
        <FilmIcon className="h-3.5 w-3.5" />
        Watch
      </button>
    )
  } else if (resource.type === 'pdf' && canOpen) {
    primaryLabel = 'Preview'
    primaryIcon  = EyeIcon
    primaryAction = (
      <button
        onClick={() => setPreviewResource(resource)}
        className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-white transition-colors"
        style={{ backgroundColor: '#1A3550' }}
      >
        <EyeIcon className="h-3.5 w-3.5" />
        Preview
      </button>
    )
  } else {
    primaryLabel = 'Download'
    primaryIcon  = ArrowDownTrayIcon
    primaryAction = (
      <a
        href={downloadHref(resource.url, resource.title)}
        download
        className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-white transition-colors"
        style={{ backgroundColor: '#1A3550' }}
      >
        <ArrowDownTrayIcon className="h-3.5 w-3.5" />
        Download
      </a>
    )
  }

  return (
    <>
      <div
        id={resource.id}
        className={`not-prose my-3 flex items-center gap-3 rounded-lg border px-4 py-3 transition-shadow ${
          hideDescription
            ? 'bg-white/95 border-slate-200 shadow-sm backdrop-blur-sm hover:shadow-md dark:border-[#D4891A50] dark:bg-[#1A3550]/80'
            : 'bg-slate-50 border-slate-200 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900/60'
        }`}
      >
        {/* Icon */}
        <div
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md"
          style={{ backgroundColor: '#0D2038' }}
        >
          <Icon className="h-4.5 w-4.5 h-[18px] w-[18px] text-white" />
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              {resource.title}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0 text-[11px] font-medium leading-5 ${meta.color}`}
            >
              {meta.label}
            </span>
            {resource.size && (
              <span className="text-xs text-slate-500 dark:text-slate-300">{resource.size}</span>
            )}
          </div>
          {!hideDescription && resource.description && (
            <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-300 line-clamp-2">
              {resource.description}
            </p>
          )}
        </div>

        {/* Primary action */}
        <div className="flex-shrink-0">
          {primaryAction}
        </div>

        {/* Secondary: download link when primary is Watch/Preview */}
        {(resource.type === 'video' || resource.type === 'pdf') && canOpen && (
          <a
            href={downloadHref(resource.url, resource.title)}
            download
            title="Download"
            className="flex-shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:text-slate-600 dark:text-[#9FB8D0] dark:hover:text-white"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
          </a>
        )}
      </div>

      <MediaModal resource={previewResource} onClose={() => setPreviewResource(null)} />
    </>
  )
}

// ─── ResourceList ─────────────────────────────────────────────────────────────

interface ResourceListProps {
  /** Comma-separated list of resource IDs from config/resources.json.
   *  Omit (or leave blank) to show all resources. */
  ids?: string
}

export function ResourceList({ ids }: ResourceListProps) {
  const [previewResource, setPreviewResource] = useState<Resource | null>(null)
  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState<Resource['type'] | 'all'>('all')

  const idList = ids ? ids.split(',').map(s => s.trim()).filter(Boolean) : []
  const baseResources = idList.length > 0
    ? idList.map(id => (allResources as Resource[]).find(r => r.id === id)).filter((r): r is Resource => r !== undefined)
    : (allResources as Resource[])

  // Derive which types are actually present so we only show relevant pills
  const presentTypes = useMemo(
    () => [...new Set(baseResources.map(r => r.type))] as Resource['type'][],
    [baseResources]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return baseResources.filter(r => {
      if (activeType !== 'all' && r.type !== activeType) return false
      if (q && !r.title.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q)) return false
      return true
    })
  }, [baseResources, search, activeType])

  if (baseResources.length === 0) return null

  const showToolbar = baseResources.length > 2

  return (
    <>
      <div className="not-prose my-6">
        {/* ── Toolbar ── */}
        {showToolbar && (
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-48">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search resources…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-1.5 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Type pills — only show if there's more than one type */}
            {presentTypes.length > 1 && (
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setActiveType('all')}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    activeType === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  All
                </button>
                {presentTypes.map(type => {
                  const meta = TYPE_META[type] ?? TYPE_META.other
                  const isActive = activeType === type
                  return (
                    <button
                      key={type}
                      onClick={() => setActiveType(isActive ? 'all' : type)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        isActive ? 'ring-2 ring-offset-1 ring-blue-500 ' + meta.color : meta.color + ' opacity-70 hover:opacity-100'
                      }`}
                    >
                      {meta.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Grid ── */}
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No resources match your search.</p>
        ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map(resource => {
            const meta = TYPE_META[resource.type] ?? TYPE_META.other
            const Icon = meta.icon
            const canPreview = PREVIEWABLE.includes(resource.type) && !!(resource.viewUrl || resource.url)

            return (
              <div
                key={resource.id}
                className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
              >
                {/* Header row */}
                <div className="mb-3 flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0 rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                    <Icon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {resource.title}
                    </h4>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${meta.color}`}>
                        {meta.label}
                      </span>
                      {resource.size && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {resource.size}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {resource.description && (
                  <p className="mb-4 flex-1 text-sm text-gray-600 dark:text-gray-400">
                    {resource.description}
                  </p>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  <a
                    href={downloadHref(resource.url, resource.title)}
                    download
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                  >
                    <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                    Download
                  </a>
                  {canPreview && (
                    <button
                      onClick={() => setPreviewResource(resource)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <EyeIcon className="h-3.5 w-3.5" />
                      {resource.type === 'video' ? 'Watch' : 'Preview'}
                    </button>
                  )}
                  {!canPreview && resource.viewUrl && (
                    <a
                      href={resource.viewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                      Open in tab
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        )}
      </div>

      <MediaModal resource={previewResource} onClose={() => setPreviewResource(null)} />
    </>
  )
}
