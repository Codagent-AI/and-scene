import { lazy, Suspense } from 'react'
import { presentations } from './presentations'
import { Landing } from './Landing'
const routes = presentations.map(entry => ({ ...entry, Component: lazy(entry.load) }))
export function Router({ pathname = window.location.pathname }: { pathname?: string }) {
  const route = routes.find(entry => `/${entry.slug}` === pathname.replace(/\/$/, ''))
  if (!route) return <Landing />
  return <Suspense fallback={<p role="status">Loading presentation…</p>}><route.Component /></Suspense>
}
