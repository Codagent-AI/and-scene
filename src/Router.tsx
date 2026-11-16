import { lazy, Suspense } from 'react'
import { presentations } from './presentations'
import { Landing } from './Landing'
import { resolveRoute } from './routing'
const routes = new Map(presentations.map(p => { const Page = lazy(p.load); return [p.slug, <Page />] }))
export function Router({ pathname = window.location.pathname }: { pathname?: string }) {
  const route = resolveRoute(pathname)
  return route ? <Suspense fallback={<p>Loading presentation…</p>}>{routes.get(route.slug)}</Suspense> : <Landing />
}
