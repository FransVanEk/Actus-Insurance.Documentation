'use client'

import React from 'react'
import { useLayout } from './LayoutContext'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const { isSidebarCollapsed } = useLayout()

  return (
    <div
      className="transition-[padding] duration-300 ease-in-out"
      style={{ paddingLeft: isSidebarCollapsed ? '0px' : '320px' }}
    >
      {children}
    </div>
  )
}
