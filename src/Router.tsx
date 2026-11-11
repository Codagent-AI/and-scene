import { lazy, Suspense } from 'react'
import Landing from './Landing'
import { findPresentation, presentations } from './presentations'
const components = new Map(presentations.map(entry => [entry.slug, lazy(entry.load)]))
export function Router({ pathname = window.location.pathname }: { pathname?: string }) {
  const entry = findPresentation(pathname)
  if (!entry) return <Landing />
  const Talk = components.get(entry.slug)!
  return <Suspense fallback={<p role="status">Loading presentation…</p>}><Talk /></Suspense>
}
