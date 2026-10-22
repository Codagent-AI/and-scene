import { lazy } from 'react'
import type { ComponentType, LazyExoticComponent } from 'react'
import type { PresentationEntry } from './registry.ts'

const cache = new WeakMap<PresentationEntry, LazyExoticComponent<ComponentType>>()

/** One lazy component per registry entry, so re-rendering never re-imports or remounts. */
export function lazyPresentation(entry: PresentationEntry): LazyExoticComponent<ComponentType> {
  let component = cache.get(entry)
  if (!component) {
    component = lazy(entry.load)
    cache.set(entry, component)
  }
  return component
}
