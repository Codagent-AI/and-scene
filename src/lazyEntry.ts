import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { PresentationEntry } from './presentations/index.ts'

const cache = new WeakMap<PresentationEntry, LazyExoticComponent<ComponentType>>()

/** One lazy component per registry entry, so its identity is stable across renders. */
export function lazyEntry(entry: PresentationEntry): LazyExoticComponent<ComponentType> {
  let component = cache.get(entry)
  if (!component) {
    component = lazy(entry.load)
    cache.set(entry, component)
  }
  return component
}
