import { lazy, Suspense } from 'react'
import Landing from './Landing'
import { presentations } from './presentations'
const routes = presentations.map(entry => ({ slug: entry.slug, Page: lazy(entry.load) }))
export function Router({ pathname = window.location.pathname }: { pathname?: string }) {
  const Page = routes.find(entry => `/${entry.slug}` === pathname.replace(/\/$/, ''))?.Page ?? Landing
  return <Suspense fallback={<p role="status">Loading presentation…</p>}><Page /></Suspense>
}
