import { Suspense, use } from 'react'
import { Landing } from './Landing'
import { presentations as defaultRegistry, type PresentationEntry } from './presentations'
import { resolveRoute } from './router'

const loads = new WeakMap<PresentationEntry, ReturnType<PresentationEntry['load']>>()

function PresentationRoute({ entry }: { entry: PresentationEntry }) {
  let loading = loads.get(entry)
  if (!loading) {
    loading = entry.load()
    loads.set(entry, loading)
  }
  const { default: Loaded } = use(loading)
  return <Loaded />
}

export function Root({
  pathname = window.location.pathname,
  registry = defaultRegistry,
}: {
  pathname?: string
  registry?: readonly PresentationEntry[]
}) {
  const route = resolveRoute(pathname, registry)
  if (route.kind === 'landing') return <Landing registry={registry} />
  return (
    <Suspense fallback={null}>
      <PresentationRoute entry={route.entry} />
    </Suspense>
  )
}
