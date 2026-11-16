import { lazy, Suspense } from 'react'
import Landing from './Landing'
import { presentations } from './presentations'
import { resolvePresentation } from './routing'
const routes = new Map(presentations.map(entry => { const Route = lazy(entry.load); return [entry.slug, <Route />] }))
export default function Router({ path = window.location.pathname }: { path?: string }) {
  const entry = resolvePresentation(path, presentations)
  return entry ? <Suspense fallback={<p role="status">Loading presentation…</p>}>{routes.get(entry.slug)}</Suspense> : <Landing />
}
