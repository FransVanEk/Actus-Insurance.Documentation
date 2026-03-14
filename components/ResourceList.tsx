'use client'

import React, { useState, useRef } from 'react'
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
} from '@heroicons/react/24/outline'
import allResources from '../config/resources.json'

export interface Resource {
  id: string
  title: string
  description: string
  type: 'pdf' | 'powerpoint' | 'video' | 'excel' | 'word' | 'zip' | 'other'
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
  other:       { label: 'File',       color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',        icon: DocumentIcon },
}

/** Types that can be previewed inline in the modal */
const PREVIEWABLE: Resource['type'][] = ['video', 'pdf']

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
                href={resource.url}
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

// ─── ResourceList ─────────────────────────────────────────────────────────────

interface ResourceListProps {
  /** Comma-separated list of resource IDs from config/resources.json */
  ids: string
}

export function ResourceList({ ids }: ResourceListProps) {
  const [previewResource, setPreviewResource] = useState<Resource | null>(null)

  const idList = ids.split(',').map(s => s.trim()).filter(Boolean)
  const resources = idList
    .map(id => (allResources as Resource[]).find(r => r.id === id))
    .filter((r): r is Resource => r !== undefined)

  if (resources.length === 0) return null

  return (
    <>
      <div className="not-prose my-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {resources.map(resource => {
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
                    href={resource.url}
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
      </div>

      <MediaModal resource={previewResource} onClose={() => setPreviewResource(null)} />
    </>
  )
}
