import { Suspense } from 'react'
import { Landing } from './Landing'
import { presentations } from './presentations'
import { createRoutes } from './routes'
const defaultRoutes = createRoutes(presentations)
export function Router({ pathname = window.location.pathname, routes = defaultRoutes }: { pathname?: string; routes?: ReturnType<typeof createRoutes> }) {
  const route = routes.find(item => pathname === `/${item.slug}` || pathname === `/${item.slug}/`)
  return route ? <Suspense fallback={<p role="status">Loading presentation…</p>}><route.Page /></Suspense> : <Landing entries={routes} />
}
