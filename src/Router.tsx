import { lazy, Suspense } from 'react'
import { presentations } from './presentations'
import Landing from './Landing'
const routes = presentations.map(entry => ({ ...entry, Component: lazy(entry.load) }))
export function Router({ path = window.location.pathname }: { path?: string }) {
  const route = routes.find(entry => path === `/${entry.slug}` || path === `/${entry.slug}/`)
  if (!route) return <Landing />
  return <Suspense fallback={<p role="status">Loading presentation…</p>}><route.Component /></Suspense>
}
