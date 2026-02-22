'use client'

import React, { createContext, useContext, useState } from 'react'

interface LayoutContextType {
  isSidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean) => void
  isTocCollapsed: boolean
  setTocCollapsed: (v: boolean) => void
}

const LayoutContext = createContext<LayoutContextType>({
  isSidebarCollapsed: false,
  setSidebarCollapsed: () => {},
  isTocCollapsed: false,
  setTocCollapsed: () => {},
})

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isTocCollapsed, setTocCollapsed] = useState(false)

  return (
    <LayoutContext.Provider value={{ isSidebarCollapsed, setSidebarCollapsed, isTocCollapsed, setTocCollapsed }}>
      {children}
    </LayoutContext.Provider>
  )
}

export function useLayout() {
  return useContext(LayoutContext)
}
