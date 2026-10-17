import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import { presentations, type PresentationEntry } from './presentations/index.ts'

export type Route = { kind: 'landing' } | { kind: 'presentation'; entry: PresentationEntry; Component: ComponentType }

/** `/` and unknown paths render Landing; `/<slug>` (optionally with a trailing slash) a presentation. */
export function resolveRoute(
  pathname: string,
  registry: ReadonlyArray<PresentationEntry> = presentations,
): Route {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  const entry = slug ? registry.find((candidate) => candidate.slug === slug) : undefined
  return entry
    ? { kind: 'presentation', entry, Component: lazyPresentation(entry) }
    : { kind: 'landing' }
}

const lazyCache = new WeakMap<PresentationEntry, LazyExoticComponent<ComponentType>>()

/** One lazy component per registry entry, so re-renders never recreate it. */
export function lazyPresentation(entry: PresentationEntry) {
  let component = lazyCache.get(entry)
  if (!component) {
    component = lazy(entry.load)
    lazyCache.set(entry, component)
  }
  return component
}
