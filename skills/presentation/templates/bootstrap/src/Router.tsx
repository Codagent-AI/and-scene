import { Suspense, createElement, use } from 'react'
import { Landing } from './Landing'
import { PRESENTATIONS } from './presentations'
import type { PresentationEntry } from './presentations'
import { resolveEntry } from './routes'

const loads = new WeakMap<PresentationEntry, ReturnType<PresentationEntry['load']>>()

function loadOnce(entry: PresentationEntry) {
  let promise = loads.get(entry)
  if (!promise) {
    promise = entry.load()
    loads.set(entry, promise)
  }
  return promise
}

function Loaded({ entry }: { entry: PresentationEntry }) {
  return createElement(use(loadOnce(entry)).default)
}

export interface RouterProps {
  pathname?: string
  entries?: readonly PresentationEntry[]
}

/** "/" lists presentations, "/<slug>" mounts one, anything else falls back to the listing. */
export function Router({
  pathname = window.location.pathname,
  entries = PRESENTATIONS,
}: RouterProps) {
  const entry = resolveEntry(pathname, entries)
  if (!entry) return <Landing entries={entries} />
  return (
    <Suspense fallback={null}>
      <Loaded entry={entry} />
    </Suspense>
  )
}
