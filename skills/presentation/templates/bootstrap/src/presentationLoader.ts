import { lazy } from 'react'
import type { ComponentType, LazyExoticComponent } from 'react'
import { presentations } from './presentations'

const cache = new Map<string, LazyExoticComponent<ComponentType>>()

/**
 * Lazily wraps a registered presentation's `load()` exactly once per slug and
 * caches the result, since `lazy()` must not be called fresh on every render.
 */
export function getPresentationComponent(slug: string): LazyExoticComponent<ComponentType> | null {
  const cached = cache.get(slug)
  if (cached) return cached

  const entry = presentations.find((candidate) => candidate.slug === slug)
  if (!entry) return null

  const Component = lazy(entry.load)
  cache.set(slug, Component)
  return Component
}
