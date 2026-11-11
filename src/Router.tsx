import { lazy, Suspense } from 'react'
import { Landing } from './Landing'
import { presentations } from './presentations'
const routes = presentations.map(entry => ({ ...entry, Component: lazy(entry.load) }))
export function Router({ pathname = window.location.pathname }: { pathname?: string }) {
  const route = routes.find(entry => `/${entry.slug}` === pathname.replace(/\/$/, ''))
  if (!route) return <Landing />
  const Component = route.Component
  return <Suspense fallback={<p>Opening presentation…</p>}><Component /></Suspense>
}
