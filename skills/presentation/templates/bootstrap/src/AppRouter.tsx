import { createElement, lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react'
import Landing from './Landing.tsx'
import { presentations, type PresentationEntry } from './presentations/index.ts'
import { resolveRoute } from './route.ts'

const lazyTalks = new WeakMap<PresentationEntry, LazyExoticComponent<ComponentType>>()

function lazyTalk(entry: PresentationEntry) {
  let Talk = lazyTalks.get(entry)
  if (!Talk) lazyTalks.set(entry, (Talk = lazy(entry.load)))
  return Talk
}

function PresentationHost({ entry }: { entry: PresentationEntry }) {
  return <Suspense fallback={null}>{createElement(lazyTalk(entry))}</Suspense>
}

export default function AppRouter({
  pathname = window.location.pathname,
  entries = presentations,
}: {
  pathname?: string
  entries?: readonly PresentationEntry[]
}) {
  const route = resolveRoute(pathname, entries)
  return route.kind === 'presentation' ? (
    <PresentationHost entry={route.entry} />
  ) : (
    <Landing entries={entries} />
  )
}
