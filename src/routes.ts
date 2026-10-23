import { lazy, type ComponentType } from 'react'
import type { PresentationEntry } from './presentations/types'

const lazyCache = new WeakMap<PresentationEntry, ComponentType>()

/** One lazy component per registry entry, so the chunk loads only when its route is opened. */
export function componentFor(entry: PresentationEntry): ComponentType {
  let component = lazyCache.get(entry)
  if (!component) {
    component = lazy(entry.load)
    lazyCache.set(entry, component)
  }
  return component
}

/** "/" and unknown paths resolve to null (Landing); "/<slug>" and "/<slug>/" to a registered presentation. */
export function resolveRoute(pathname: string, registry: readonly PresentationEntry[]): PresentationEntry | null {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  return registry.find((entry) => entry.slug === slug) ?? null
}
