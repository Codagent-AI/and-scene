import { Suspense, lazy } from 'react'
import { Landing } from './Landing'
import { presentations } from './presentations'
import { resolveRoute } from './router'

const lazyRoutes = Object.fromEntries(presentations.map((entry) => [entry.slug, lazy(entry.load)]))

export function Router({ pathname = window.location.pathname }: { pathname?: string }) {
  const route = resolveRoute(pathname, presentations)
  if (route.kind === 'landing') return <Landing presentations={presentations} />
  const Presentation = lazyRoutes[route.entry.slug]
  return (
    <Suspense fallback={null}>
      <Presentation />
    </Suspense>
  )
}
