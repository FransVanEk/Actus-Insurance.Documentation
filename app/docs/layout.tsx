import React from 'react'
import { getDocNavigation } from '../../lib/markdown'
import { Sidebar } from '../../components/Sidebar'

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const navigation = getDocNavigation()

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Sidebar navigation={navigation} />
      
      {/* Main content */}
      <div className="lg:pl-80">
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}