import { Suspense } from 'react'
import { routes as defaultRoutes } from './routes'
import type { createRoutes } from './routes'
import { Landing } from './Landing'
export function Router({ path = window.location.pathname, routes = defaultRoutes }: { path?: string; routes?: ReturnType<typeof createRoutes> }) {
  const entry = routes.find(entry => path === `/${entry.slug}`)
  if (!entry) return <Landing entries={routes} />
  const Page = entry.Page
  return <Suspense fallback={<p role="status">Loading presentation…</p>}><Page /></Suspense>
}
