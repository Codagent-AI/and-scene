import { lazy, Suspense } from 'react'
import Landing from './Landing'
import { presentations } from './presentations'
const routes = presentations.map(p => ({ ...p, Component: lazy(p.load) }))
export function Router({ pathname = window.location.pathname }: { pathname?: string }) {
  const match = routes.find(p => `/${p.slug}` === pathname.replace(/\/$/, ''))
  return match ? <Suspense fallback={<p role="status">Loading presentation…</p>}><match.Component /></Suspense> : <Landing />
}
