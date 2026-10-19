import { Suspense, lazy, type ComponentType } from 'react'
import Landing from './Landing.tsx'
import { presentations, type PresentationEntry } from './presentations'
import { resolveRoute } from './route.ts'

const lazyTalks = new WeakMap<PresentationEntry['load'], ComponentType>()

/** Lazy components are cached per loader so re-renders never remount the presentation. */
function talkFor(entry: PresentationEntry): ComponentType {
  let Talk = lazyTalks.get(entry.load)
  if (!Talk) {
    Talk = lazy(entry.load)
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
    <Suspense fallback={null}>
      {/* eslint-disable-next-line react-hooks/static-components */}
      <Talk />
    </Suspense>
  )
}
