import { Suspense, use, useMemo, type ComponentType, type ReactNode } from 'react'
import Landing from './Landing.tsx'
import { presentations as defaultRegistry, type PresentationEntry } from './presentations/index.ts'
import { resolveRoute } from './route.ts'

type Loaded = { default: ComponentType }
const loads = new WeakMap<PresentationEntry['load'], Promise<Loaded>>()

/** Each presentation module is requested once, on first visit to its route. */
function loadOnce(entry: PresentationEntry) {
  let loading = loads.get(entry.load)
  if (!loading) {
    loading = entry.load()
    loads.set(entry.load, loading)
  }
  return loading
}

function PresentationRoute({ entry }: { entry: PresentationEntry }) {
  const loaded = use(loadOnce(entry))
  return <loaded.default />
}

export default function Router({
  pathname = window.location.pathname,
  registry = defaultRegistry,
  fallback,
}: {
  pathname?: string
  registry?: readonly PresentationEntry[]
  /** Shown instead of the landing page for paths that match no presentation (e.g. a host app). */
  fallback?: ReactNode
}) {
  const route = useMemo(() => resolveRoute(pathname, registry), [pathname, registry])
  if (route.kind === 'landing') return fallback ?? <Landing presentations={registry} />
  return (
    <Suspense fallback={null}>
      <PresentationRoute entry={route.entry} />
    </Suspense>
  )
}
