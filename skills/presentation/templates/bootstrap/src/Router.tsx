import { lazy, Suspense } from 'react'
import { presentations } from './presentations'
import Landing from './Landing'
import { resolveRoute } from './routes'
const routes = new Map(presentations.map(entry => [entry.slug, lazy(entry.load)]))
export function Router({ path = window.location.pathname }: { path?: string }) {
  const entry = resolveRoute(path)
  const Page = entry && routes.get(entry.slug)
  return Page ? <Suspense fallback={<p role="status">Opening presentation…</p>}><Page /></Suspense> : <Landing />
}
