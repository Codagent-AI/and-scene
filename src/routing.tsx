import { lazy, Suspense } from 'react'
import Landing from './Landing'
import { presentations, type PresentationEntry } from './presentations'

export function resolvePresentation(pathname: string, entries = presentations) {
  return entries.find(entry => `/${entry.slug}` === pathname.replace(/\/$/, ''))
}

/** Prepare lazy components once, outside rendering, preserving route identity. */
export function createPresentationRouter(entries: PresentationEntry[]) {
  const routes = entries.map(entry => ({ ...entry, Component: lazy(entry.load) }))
  return function PresentationRouter({ pathname = window.location.pathname }: { pathname?: string }) {
    const route = routes.find(entry => `/${entry.slug}` === pathname.replace(/\/$/, ''))
    if (!route) return <Landing entries={entries} />
    return <Suspense fallback={<p role="status">Loading presentation…</p>}><route.Component /></Suspense>
  }
}
