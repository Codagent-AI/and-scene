import { Suspense } from 'react'
import Landing from './Landing'
import type { PresentationRoute } from './routes'

export default function Router({ pathname, routes }: {
  pathname: string
  routes: readonly PresentationRoute[]
}) {
  const slug = pathname.replace(/^\//, '').replace(/\/$/, '')
  const Route = routes.find(item => item.slug === slug)?.component

  return Route
    ? <Suspense fallback={<p>Loading presentation…</p>}><Route /></Suspense>
    : <Landing entries={routes} />
}
