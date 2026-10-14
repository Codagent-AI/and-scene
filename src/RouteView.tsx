import { lazy, Suspense } from 'react'
import { Landing } from './Landing'
import { PRESENTATIONS } from './presentations'
import { resolveRoute } from './router'

// Each registered presentation becomes its own lazy chunk. Built once at module load.
const ROUTABLE = PRESENTATIONS.map((entry) => ({ ...entry, Talk: lazy(entry.load) }))

export function RouteView({ pathname }: { pathname: string }) {
  const route = resolveRoute(pathname, ROUTABLE)
  if (route.kind === 'landing') return <Landing />
  if (route.kind === 'not-found') {
    return (
      <main className="landing">
        <h1>Not found</h1>
        <p>No presentation at {route.pathname}.</p>
        <a href="/">Back to the index</a>
      </main>
    )
  }
  const { Talk } = route.entry
  return (
    <Suspense fallback={null}>
      <Talk />
    </Suspense>
  )
}
