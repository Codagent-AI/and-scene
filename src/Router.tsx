import { lazy, Suspense } from 'react'
import Landing from './Landing'
import { findPresentation, presentations } from './presentations'

const views = new Map(presentations.map(entry => {
  const Talk = lazy(entry.load)
  return [entry.slug, <Suspense key={entry.slug} fallback={<p role="status">Loading presentation…</p>}><Talk /></Suspense>]
}))
export function Router({ pathname = window.location.pathname }: { pathname?: string }) {
  const entry = findPresentation(pathname)
  return entry ? views.get(entry.slug) : <Landing />
}
