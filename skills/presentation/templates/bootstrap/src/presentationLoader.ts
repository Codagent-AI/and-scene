import { lazy } from 'react'
import type { ComponentType, LazyExoticComponent } from 'react'
import type { PresentationRegistryEntry } from './presentations'

const cache = new Map<string, LazyExoticComponent<ComponentType>>()

/**
 * Lazily wraps a registered presentation's `load()` exactly once per slug and
 * caches the result, since `lazy()` must not be called fresh on every render.
 */
export function getPresentationComponent(entry: PresentationRegistryEntry): LazyExoticComponent<ComponentType> {
  let Component = cache.get(entry.slug)
  if (!Component) {
    Component = lazy(entry.load)
    cache.set(entry.slug, Component)
  }
  return Component
}
