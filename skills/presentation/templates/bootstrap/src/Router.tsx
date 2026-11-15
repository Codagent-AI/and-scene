import { lazy, Suspense } from 'react'
import { Landing } from './Landing'
import { presentations } from './presentations'
const routes = presentations.map(p => {
  const Talk = lazy(p.load)
  return { slug: p.slug, element: <Suspense fallback={<p>Loading presentation…</p>}><Talk /></Suspense> }
})
export function Router({ path = window.location.pathname }: { path?: string }) {
  return routes.find(p => path === `/${p.slug}` || path === `/${p.slug}/`)?.element ?? <Landing />
}
