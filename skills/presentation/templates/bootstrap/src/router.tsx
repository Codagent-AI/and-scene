import { Suspense, createElement } from 'react'
import { Landing } from './Landing'
import type { PresentationEntry } from './presentations/registry'
import { pageFor, resolveEntry } from './routes'

interface RouterProps {
  pathname: string
  registry: readonly PresentationEntry[]
}

/** "/" and unknown paths render Landing; a known slug lazy-loads its presentation. */
export function Router({ pathname, registry }: RouterProps) {
  const entry = resolveEntry(pathname, registry)
  if (!entry) return <Landing registry={registry} />
  return (
    <Suspense fallback={<p data-presentation-loading="">Loading…</p>}>
      {createElement(pageFor(entry))}
    </Suspense>
  )
}
