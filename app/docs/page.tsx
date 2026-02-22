import React from 'react'
import { redirect } from 'next/navigation'

export default function DocsHomePage() {
  // Redirect to the framework documentation (now the primary section)
  redirect('/docs/framework')
}