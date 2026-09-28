import { Suspense, lazy, useEffect, useState, type ComponentType, type LazyExoticComponent } from 'react'
import { Landing } from './Landing'
import type { PresentationRegistryEntry } from './presentations'

export interface RouterProps {
  registry: PresentationRegistryEntry[]
}

function normalizeSlug(pathname: string): string {
  return pathname.replace(/^\/+|\/+$/g, '')
}

const lazyComponentCache = new Map<
  PresentationRegistryEntry['load'],
  LazyExoticComponent<ComponentType>
>()

function getLazyComponent(entry: PresentationRegistryEntry): LazyExoticComponent<ComponentType> {
  const cached = lazyComponentCache.get(entry.load)
  if (cached) return cached
  const created = lazy(entry.load)
  lazyComponentCache.set(entry.load, created)
  return created
}

/**
 * Zero-dependency pathname router: "/" resolves to the landing page, "/<slug>"
 * resolves to the matching registry entry lazy-loaded, and any unresolved
 * pathname falls back to the landing page.
 */
export function Router({ registry }: RouterProps) {
  const [pathname, setPathname] = useState(() => window.location.pathname)

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const slug = normalizeSlug(pathname)
  const entry = slug ? registry.find((candidate) => candidate.slug === slug) : undefined

  if (!entry) {
    return <Landing registry={registry} />
  }

  // getLazyComponent caches by entry.load, so this always returns the same
  // component reference for a given registry entry across renders.
  const LazyPresentation = getLazyComponent(entry)

  return (
    <Suspense fallback={<div data-presentation-loading="true">Loading…</div>}>
      {/* eslint-disable-next-line react-hooks/static-components -- module-level cache in getLazyComponent keeps this reference stable across renders. */}
      <LazyPresentation />
    </Suspense>
  )
}
