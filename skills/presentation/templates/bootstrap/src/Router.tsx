import { lazy, Suspense } from 'react'
import { Landing } from './Landing'
import { presentations } from './presentations'
import { resolveRoute } from './routing'
const routes = new Map(presentations.map(entry => {
  const Talk = lazy(entry.load)
  return [entry.slug, <Talk />]
}))
export function Router({ pathname = window.location.pathname }: { pathname?: string }) {
  const entry = resolveRoute(pathname)
  const content = entry && routes.get(entry.slug)
  return content ? <Suspense fallback={<p>Loading presentation…</p>}>{content}</Suspense> : <Landing />
}
