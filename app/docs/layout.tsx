import React from 'react'
import { getDocNavigation } from '../../lib/markdown'
import { Sidebar } from '../../components/Sidebar'
import { LayoutProvider } from '../../components/LayoutContext'
import { ClientLayout } from '../../components/ClientLayout'

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const navigation = getDocNavigation()

  return (
    <LayoutProvider>
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Sidebar navigation={navigation} />

        {/* Main content — padding adjusts when sidebar is collapsed */}
        <ClientLayout>
          <main className="flex-1">
            {children}
          </main>
        </ClientLayout>
      </div>
    </LayoutProvider>
  )
}