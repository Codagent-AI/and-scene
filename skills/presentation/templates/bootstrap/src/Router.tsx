import { Suspense } from 'react'
import { Landing } from './Landing'
import { findPresentation, routes } from './presentations'
export function Router({ path = window.location.pathname, entries = routes }: { path?: string; entries?: typeof routes }) {
  const Talk = findPresentation(path, entries)?.Component
  return Talk ? <Suspense fallback={<p role="status">Loading presentation…</p>}><Talk /></Suspense> : <Landing />
}
