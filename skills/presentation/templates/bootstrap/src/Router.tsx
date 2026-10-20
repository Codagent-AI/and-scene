import { createElement, lazy, Suspense, type ComponentType } from 'react'
import { Landing } from './Landing.tsx'
import type { PresentationEntry } from './presentations/index.ts'

const lazyCache = new WeakMap<PresentationEntry['load'], ComponentType>()

function lazyFor(entry: PresentationEntry): ComponentType {
  let component = lazyCache.get(entry.load)
  if (!component) {
    component = lazy(entry.load)
    lazyCache.set(entry.load, component)
  }
  return component
}

/** Pathname router: "/" and unknown paths show the landing page, "/<slug>" the matching presentation. */
export function Router({ registry, pathname }: { registry: readonly PresentationEntry[]; pathname: string }) {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  const entry = registry.find((e) => e.slug === slug)
  if (!entry) return <Landing registry={registry} />
  // The lazy component is memoized per registry entry, so its identity is stable across renders.
  return <Suspense fallback={null}>{createElement(lazyFor(entry))}</Suspense>
}
