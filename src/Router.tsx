import { lazy, Suspense } from 'react'
import Landing from './Landing'
import { presentations } from './presentations'

const routes = presentations.map(entry => ({ ...entry, Component: lazy(entry.load) }))
export function Router({ pathname = window.location.pathname }: { pathname?: string }) {
  const route = routes.find(entry => pathname === `/${entry.slug}` || pathname === `/${entry.slug}/`)
  if (!route) return <Landing />
  return <Suspense fallback={<p role="status">Opening presentation…</p>}><route.Component /></Suspense>
}
