import { Suspense, lazy, type ComponentType } from 'react'
import Landing from './Landing.tsx'
import type { PresentationEntry } from './presentations/index.ts'
import { resolveRoute } from './route.ts'

const talks = new WeakMap<PresentationEntry, ComponentType>()

/** One lazy component per registry entry, created on first visit and then reused. */
function talkFor(entry: PresentationEntry): ComponentType {
  let Talk = talks.get(entry)
  if (!Talk) {
    Talk = lazy(entry.load)
    talks.set(entry, Talk)
  }
  return Talk
}

export default function Router({
  pathname,
  entries,
}: {
  pathname: string
  entries: readonly PresentationEntry[]
}) {
  const entry = resolveRoute(pathname, entries)
  if (!entry) return <Landing entries={entries} />
  const Talk = talkFor(entry)
  return (
    <Suspense fallback={<p data-presentation-loading="">Loading…</p>}>
      {/* eslint-disable-next-line react-hooks/static-components -- cached per entry, never recreated */}
      <Talk />
    </Suspense>
  )
}
