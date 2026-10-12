import { lazy, Suspense } from 'react'
import Landing from './Landing.tsx'
import { findPresentation, presentations, resolveRoute } from './presentations/index.ts'

const lazyRoutes = Object.fromEntries(presentations.map((entry) => [entry.slug, lazy(entry.load)]))
export function Router() {
  const route = resolveRoute(window.location.pathname)
  if (route.kind === 'landing') return <Landing />
  const entry = findPresentation(route.slug)
  const Talk = lazyRoutes[route.slug]
  if (!entry || !Talk) return <Landing />
  return <Suspense fallback={<div>Loading presentation…</div>}><Talk /></Suspense>
}
