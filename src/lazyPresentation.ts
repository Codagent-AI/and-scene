import { lazy } from 'react'
import type { ComponentType } from 'react'
import type { PresentationEntry } from './presentations/index.ts'

const cache = new WeakMap<PresentationEntry, ComponentType>()

/** One `React.lazy` component per registry entry, so re-renders never reload it. */
export function lazyPresentation(entry: PresentationEntry) {
  let component = cache.get(entry)
  if (!component) {
    component = lazy(entry.load)
    cache.set(entry, component)
  }
  return component
}
