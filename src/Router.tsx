import { lazy, Suspense } from 'react'
import Landing from './Landing'
import { presentations } from './presentations'
export const routes = presentations.map(entry => ({ ...entry, Component: lazy(entry.load) }))
export default function Router({pathname = window.location.pathname}: {pathname?: string}) {
  const route = routes.find(p => `/${p.slug}` === pathname.replace(/\/$/, ''))
  return route ? <Suspense fallback={<p role="status">Loading presentation…</p>}><route.Component /></Suspense> : <Landing />
}
