import { Suspense } from 'react'
import { Landing } from './Landing'
import { resolveRoute } from './routes'
export function Router({ path = window.location.pathname }: { path?: string }) {
  const route = resolveRoute(path)
  return route ? <Suspense fallback={<p role="status">Loading presentation…</p>}><route.Component /></Suspense> : <Landing />
}
