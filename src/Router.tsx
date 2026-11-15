import { lazy, Suspense } from 'react'
import { Landing } from './Landing'
import { presentations } from './presentations'
import { routeFor } from './routes'
const routes = new Map(presentations.map(p => {
  const Talk = lazy(p.load)
  return [p.slug, <Suspense fallback={<p>Loading presentation…</p>}><Talk /></Suspense>]
}))
export function Router({ path = window.location.pathname }: { path?: string }) {
  return routes.get(routeFor(path)?.slug ?? '') ?? <Landing />
}
