import { lazy, Suspense } from 'react'
import { Landing } from './Landing'
import { presentations } from './presentations'
export function resolveRoute(pathname: string) { return presentations.find(p => `/${p.slug}` === pathname.replace(/\/$/, '')) }
const routes = new Map(presentations.map(p => [p.slug, lazy(p.load)]))
export function Router({ pathname = window.location.pathname }: { pathname?: string }) {
  const entry = resolveRoute(pathname)
  const Talk = entry && routes.get(entry.slug)
  return Talk ? <Suspense fallback={<p>Loading presentation…</p>}><Talk /></Suspense> : <Landing />
}
