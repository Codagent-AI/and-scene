import { createElement, lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react'
import Landing from './Landing.tsx'
import { PRESENTATIONS, type PresentationEntry } from './presentations/index.ts'
import { resolveRoute } from './router.ts'

const lazyTalks = new WeakMap<PresentationEntry['load'], LazyExoticComponent<ComponentType>>()

/** One lazy component per loader, so re-rendering never remounts a presentation. */
function talkFor(entry: PresentationEntry): LazyExoticComponent<ComponentType> {
  let Talk = lazyTalks.get(entry.load)
  if (!Talk) {
    Talk = lazy(entry.load)
    lazyTalks.set(entry.load, Talk)
  }
  return Talk
}

interface AppRouterProps {
  pathname: string
  entries?: readonly PresentationEntry[]
}

export default function AppRouter({ pathname, entries = PRESENTATIONS }: AppRouterProps) {
  const entry = resolveRoute(pathname, entries)
  if (!entry) return <Landing entries={entries} />
  return (
    <Suspense fallback={<p data-route-loading="">Loading…</p>}>
      {createElement(talkFor(entry))}
    </Suspense>
  )
}
