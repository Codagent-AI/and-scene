import { Suspense, use } from 'react'
import Landing from './Landing.tsx'
import { PRESENTATIONS } from './presentations/index.ts'
import type { PresentationEntry } from './presentations/index.ts'

const loads = new Map<string, ReturnType<PresentationEntry['load']>>()
function loadOnce(entry: PresentationEntry) {
  let p = loads.get(entry.slug)
  if (!p) loads.set(entry.slug, (p = entry.load()))
  return p
}

function Loaded({ entry }: { entry: PresentationEntry }) {
  const { default: Talk } = use(loadOnce(entry))
  return <Talk />
}

/** "/" and unknown paths show Landing; "/<slug>" lazy-loads that presentation. */
export default function Router({ pathname, entries = PRESENTATIONS }: { pathname: string; entries?: readonly PresentationEntry[] }) {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  const entry = entries.find((e) => e.slug === slug)
  if (!entry) return <Landing entries={entries} />
  return (
    <Suspense fallback={null}>
      <Loaded entry={entry} />
    </Suspense>
  )
}
