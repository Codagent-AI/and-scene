import { lazy, Suspense } from 'react'
import Landing from './Landing'
import { presentations } from './presentations'
const routes = presentations.map(entry => ({ ...entry, Component: lazy(entry.load) }))
export function Router({ path = window.location.pathname }: { path?: string }) {
 const route = routes.find(entry => `/${entry.slug}` === path.replace(/\/$/, ''))
 if (!route) return <Landing />
 const Component = route.Component
 return <Suspense fallback={<p>Loading presentation…</p>}><Component /></Suspense>
}
