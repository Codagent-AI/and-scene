import { lazy, Suspense } from 'react'
import { presentations } from './presentations'
import { resolveRoute } from './routing'
import { Landing } from './Landing'
const routes = new Map(presentations.map(entry => {
  const Talk = lazy(entry.load)
  return [entry.slug, <Suspense fallback={<p>Loading presentation…</p>}><Talk /></Suspense>]
}))
export function Router({ path = window.location.pathname }: { path?: string }) {
  return routes.get(resolveRoute(path)?.slug || '') || <Landing />
}
