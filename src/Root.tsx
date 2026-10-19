import { Suspense, lazy, type ComponentType } from 'react'
import ErrorBoundary from './ErrorBoundary.tsx'
import Landing from './Landing.tsx'
import { presentations, type PresentationEntry } from './presentations'
import { resolveRoute } from './route.ts'

const lazyTalks = new WeakMap<PresentationEntry['load'], ComponentType>()

/** Lazy components are cached per loader so re-renders never remount the presentation. */
function talkFor(entry: PresentationEntry): ComponentType {
  let Talk = lazyTalks.get(entry.load)
  if (!Talk) {
    const load = entry.load
    // A rejected loader is evicted so a later render can retry instead of rethrowing forever.
    Talk = lazy(() => load().catch((error) => {
      lazyTalks.delete(load)
      throw error
    }))
    lazyTalks.set(entry.load, Talk)
  }
  return Talk
}

export interface RootProps {
  pathname?: string
  registry?: ReadonlyArray<PresentationEntry>
}

export default function Root({
  pathname = window.location.pathname,
  registry = presentations,
}: RootProps) {
  const route = resolveRoute(pathname, registry)
  if (route.kind === 'landing') return <Landing presentations={registry} />
  // Cached per loader at module level, so the component identity is stable across renders.
  const Talk = talkFor(route.entry)
  return (
    <ErrorBoundary>
      <Suspense fallback={null}>
        {/* eslint-disable-next-line react-hooks/static-components */}
        <Talk />
      </Suspense>
    </ErrorBoundary>
  )
}
