import { Suspense, lazy, useMemo } from 'react'
import type { ComponentType } from 'react'
import { Landing } from './Landing'
import type { PresentationEntry } from './presentations/registry'

export function resolveEntry(
  pathname: string,
  registry: readonly PresentationEntry[],
): PresentationEntry | undefined {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  return slug ? registry.find((e) => e.slug === slug) : undefined
}

interface RouterProps {
  pathname: string
  registry: readonly PresentationEntry[]
}

/** "/" and unknown paths render Landing; a known slug lazy-loads its presentation. */
export function Router({ pathname, registry }: RouterProps) {
  const entry = resolveEntry(pathname, registry)
  const Page = useMemo<ComponentType | null>(() => (entry ? lazy(entry.load) : null), [entry])
  if (!Page) return <Landing registry={registry} />
  return (
    <Suspense fallback={<p data-presentation-loading="">Loading…</p>}>
      <Page />
    </Suspense>
  )
}
