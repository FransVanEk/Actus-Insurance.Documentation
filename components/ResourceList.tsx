'use client'

import React from 'react'
import {
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  DocumentTextIcon,
  PresentationChartBarIcon,
  FilmIcon,
  TableCellsIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline'
import allResources from '../config/resources.json'

export interface Resource {
  id: string
  title: string
  description: string
  type: 'pdf' | 'powerpoint' | 'video' | 'excel' | 'word' | 'zip' | 'other'
  size: string
  url: string
  /** Optional URL for opening in a new browser tab (e.g. PDF viewer, video player). */
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

interface ResourceListProps {
  /** Comma-separated list of resource IDs from config/resources.json */
  ids: string
}

export function ResourceList({ ids }: ResourceListProps) {
  const idList = ids.split(',').map(s => s.trim()).filter(Boolean)
  const resources = idList
    .map(id => (allResources as Resource[]).find(r => r.id === id))
    .filter((r): r is Resource => r !== undefined)

  if (resources.length === 0) return null

  return (
    <div className="not-prose my-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {resources.map(resource => {
          const meta = TYPE_META[resource.type] ?? TYPE_META.other
          const Icon = meta.icon

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
                {resource.viewUrl && (
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
  )
}
