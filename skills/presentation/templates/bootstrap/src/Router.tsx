import { lazy, Suspense } from 'react'
import { Landing } from './Landing'
import { presentations, findPresentation } from './presentations'
const routes = new Map(presentations.map(entry => {
  const Talk = lazy(entry.load)
  return [entry.slug, <Suspense fallback={<p role="status">Loading presentation…</p>}><Talk /></Suspense>] as const
}))
export function Router({ pathname = window.location.pathname }: { pathname?: string }) {
  const entry = findPresentation(pathname)
  return (entry && routes.get(entry.slug)) || <Landing />
}
