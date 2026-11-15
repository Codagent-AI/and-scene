import { lazy, Suspense } from 'react'
import { presentations } from './presentations'
import Landing from './Landing'
import { resolveRoute } from './routes'
const routes = new Map(presentations.map(entry => {
  const Page = lazy(entry.load)
  return [entry.slug, <Suspense fallback={<p role="status">Opening presentation…</p>}><Page /></Suspense>]
}))
export function Router({ path = window.location.pathname }: { path?: string }) {
  const entry = resolveRoute(path)
  return (entry && routes.get(entry.slug)) || <Landing />
}
