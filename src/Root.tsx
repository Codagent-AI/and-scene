import { Component, Suspense, use, type ReactNode } from 'react'
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

/** Falls back to the landing page when a presentation fails to load or render. */
class LoadBoundary extends Component<{ entry: PresentationEntry; fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    // Drop the cached (rejected) import so the next visit retries it.
    loads.delete(this.props.entry)
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

export function Root({
  pathname = window.location.pathname,
  registry = defaultRegistry,
}: {
  pathname?: string
  registry?: readonly PresentationEntry[]
}) {
  const route = resolveRoute(pathname, registry)
  const landing = <Landing registry={registry} />
  if (route.kind === 'landing') return landing
  return (
    <LoadBoundary key={route.entry.slug} entry={route.entry} fallback={landing}>
      <Suspense fallback={null}>
        <PresentationRoute entry={route.entry} />
      </Suspense>
    </LoadBoundary>
  )
}
