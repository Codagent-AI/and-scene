import { Suspense, lazy, useMemo, type ComponentType } from 'react'
import { Landing } from './Landing'
import { resolveSlug } from './resolveSlug'
import type { PresentationEntry } from './presentations/types'

const lazyCache = new WeakMap<PresentationEntry, ComponentType>()

function lazyFor(entry: PresentationEntry): ComponentType {
  let component = lazyCache.get(entry)
  if (!component) {
    component = lazy(entry.load)
    lazyCache.set(entry, component)
  }
  return component
}

export interface RouterProps {
  pathname: string
  registry: ReadonlyArray<PresentationEntry>
}

/** Minimal pathname router: `/` and unknown paths show Landing, `/<slug>` lazy-loads a presentation. */
export function Router({ pathname, registry }: RouterProps) {
  const slug = resolveSlug(pathname, registry)
  const entry = useMemo(() => registry.find((e) => e.slug === slug), [registry, slug])
  if (!entry) return <Landing registry={registry} />
  // lazyFor caches per entry, so the component identity is stable across renders.
  const Presentation = lazyFor(entry)
  return (
    <Suspense fallback={null}>
      {/* eslint-disable-next-line react-hooks/static-components */}
      <Presentation />
    </Suspense>
  )
}
