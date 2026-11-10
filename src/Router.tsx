import { lazy, Suspense } from 'react'
import Landing from './Landing'
import { presentations } from './presentations'
const routes = presentations.map(entry => ({ ...entry, Component: lazy(entry.load) }))
export function Router({ pathname = window.location.pathname }: { pathname?: string }) {
  const route = routes.find(entry => `/${entry.slug}` === pathname.replace(/\/$/, ''))
  return route ? <Suspense fallback={<p role="status">Loading presentation…</p>}><route.Component /></Suspense> : <Landing />
}
