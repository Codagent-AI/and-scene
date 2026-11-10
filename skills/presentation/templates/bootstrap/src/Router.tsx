import { lazy, Suspense } from 'react'
import { presentations } from './presentations'
import { Landing } from './Landing'
export function resolveRoute(path: string) { return presentations.find(entry => `/${entry.slug}` === path.replace(/\/$/, '')) }
const routes = new Map(presentations.map(entry => [entry.slug, lazy(entry.load)]))
export function Router({ path = window.location.pathname }: { path?: string }) {
  const entry = resolveRoute(path)
  const Talk = entry && routes.get(entry.slug)
  return Talk ? <Suspense fallback={<p>Loading presentation…</p>}><Talk /></Suspense> : <Landing />
}
