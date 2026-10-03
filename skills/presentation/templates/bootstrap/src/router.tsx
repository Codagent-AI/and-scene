import { lazy, Suspense, useEffect, useState, type ComponentType, type LazyExoticComponent } from 'react'
import Landing from './Landing'
import type { PresentationEntry } from './presentations'
import { resolveRoute } from './route-utils'

export function Router({ entries }: { entries: readonly PresentationEntry[] }) {
  const [path, setPath] = useState(window.location.pathname)
  useEffect(() => { const update = () => setPath(window.location.pathname); window.addEventListener('popstate', update); return () => window.removeEventListener('popstate', update) }, [])
  const resolution = resolveRoute(path, entries)
  if (resolution.kind !== 'presentation') return <Landing />
  return <RouteLoader key={resolution.entry.slug} entry={resolution.entry} />
}

function RouteLoader({ entry }: { entry: PresentationEntry }) {
  const [Route] = useState<LazyExoticComponent<ComponentType>>(() => lazy(entry.load))
  return <Suspense fallback={<p role="status">Loading presentation…</p>}><Route /></Suspense>
}
