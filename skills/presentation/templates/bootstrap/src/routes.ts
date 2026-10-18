import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { PresentationEntry } from './presentations'

/** Registry entry for a pathname; `/` and unknown paths match nothing. */
export function findEntry(pathname: string, registry: readonly PresentationEntry[]) {
  const slug = decodeURIComponent(pathname).replace(/^\/+|\/+$/g, '')
  return slug ? registry.find((entry) => entry.slug === slug) : undefined
}

const lazyEntries = new WeakMap<PresentationEntry, LazyExoticComponent<ComponentType>>()

/** One lazy component per entry, so re-renders never recreate it. */
export function lazyFor(entry: PresentationEntry) {
  let component = lazyEntries.get(entry)
  if (!component) {
    component = lazy(entry.load)
    lazyEntries.set(entry, component)
  }
  return component
}
