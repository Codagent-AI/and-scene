import { lazy, Suspense } from 'react'
import { resolveRoute } from './routes'
import { presentations } from './presentations'
import { Landing } from './Landing'
const lazyEntries = presentations.map(entry => ({ ...entry, Component: lazy(entry.load) }))
export function Router() {
  const entry = resolveRoute(window.location.pathname, lazyEntries)
  if (!entry) return <Landing />
  const { Component } = lazyEntries.find(item => item.slug === entry.slug)!
  return <Suspense fallback={<p>Loading presentation…</p>}><Component /></Suspense>
}
