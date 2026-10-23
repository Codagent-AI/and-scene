import { lazy, Suspense, useState, type ComponentType } from 'react'
import { Landing } from './Landing'
import type { PresentationEntry } from './presentations/types'

export interface RouterProps {
  entries: readonly PresentationEntry[]
  pathname: string
}

/** Lazy-loads one presentation's module; the loader runs once per mounted route. */
function PresentationRoute({ entry }: { entry: PresentationEntry }) {
  const [Presented] = useState<ComponentType>(() => lazy(entry.load))
  return (
    <Suspense fallback={<p data-presentation-loading="">Loading presentation…</p>}>
      <Presented />
    </Suspense>
  )
}

/** "/" and unknown paths show the landing page; "/<slug>" shows that presentation. */
export function Router({ entries, pathname }: RouterProps) {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  const entry = entries.find((candidate) => candidate.slug === slug)
  if (!entry) return <Landing entries={entries} />
  return <PresentationRoute key={entry.slug} entry={entry} />
}
