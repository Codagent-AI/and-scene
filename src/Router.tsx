import { Suspense, use } from 'react'
import { Landing } from './Landing'
import { resolveRoute, type PresentationEntry } from './registry'

// Each entry's module is requested once and shared by every render, so Suspense
// keeps the same pending promise until the presentation has loaded.
const modules = new WeakMap<PresentationEntry, ReturnType<PresentationEntry['load']>>()

function loadOnce(entry: PresentationEntry): ReturnType<PresentationEntry['load']> {
  let pending = modules.get(entry)
  if (!pending) {
    pending = entry.load()
    modules.set(entry, pending)
  }
  return pending
}

function PresentationModule({ entry }: { entry: PresentationEntry }) {
  const { default: Presentation } = use(loadOnce(entry))
  return <Presentation />
}

export interface RouterProps {
  pathname: string
  registry: readonly PresentationEntry[]
}

/** Renders Landing, or the matched presentation loaded on demand inside Suspense. */
export function Router({ pathname, registry }: RouterProps) {
  const route = resolveRoute(pathname, registry)
  if (route.kind === 'landing') return <Landing registry={registry} />
  return (
    <Suspense fallback={<p role="status">Loading presentation…</p>}>
      <PresentationModule entry={route.entry} />
    </Suspense>
  )
}
