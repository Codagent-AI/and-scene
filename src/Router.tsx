import { lazy, Suspense } from 'react'
import { Landing } from './Landing'
import { presentations, resolvePresentation } from './presentations'
const routes = new Map(presentations.map(entry => {
  const Talk = lazy(entry.load)
  return [entry.slug, <Talk />]
}))
export function Router({ pathname = window.location.pathname }: { pathname?: string }) {
  const entry = resolvePresentation(pathname)
  if (!entry) return <Landing />
  return <Suspense fallback={<p role="status">Loading presentation…</p>}>{routes.get(entry.slug)}</Suspense>
}
