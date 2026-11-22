import { lazy, Suspense } from 'react'
import { presentations } from './presentations'
import { Landing } from './Landing'
const routes = presentations.map(entry => ({ ...entry, Component: lazy(entry.load) }))
export function Router({ pathname = window.location.pathname }: { pathname?: string }) {
  const entry = routes.find(item => `/${item.slug}` === pathname.replace(/\/$/, ''))
  return entry ? <Suspense fallback={<p>Loading presentation…</p>}><entry.Component /></Suspense> : <Landing />
}
