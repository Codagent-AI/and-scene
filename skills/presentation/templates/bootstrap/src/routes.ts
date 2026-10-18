import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { PresentationEntry } from './presentations'

/** Registry entry for a pathname; `/` and unknown paths match nothing. */
export function findEntry(pathname: string, registry: readonly PresentationEntry[]) {
  let path = pathname
  try {
    path = decodeURIComponent(pathname)
  } catch {
    // Malformed percent-encoding cannot name a registered slug: treat it as an unknown path.
  }
  const slug = path.replace(/^\/+|\/+$/g, '')
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
