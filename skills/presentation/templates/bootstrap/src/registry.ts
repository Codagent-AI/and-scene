import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

export type Route = { kind: 'landing' } | { kind: 'presentation'; entry: PresentationEntry }

export type PresentationComponents = ReadonlyMap<string, LazyExoticComponent<ComponentType>>

/** Maps a pathname to Landing, or to the registry entry for `/<slug>`. Unknown paths fall back to Landing. */
export function resolveRoute(pathname: string, registry: readonly PresentationEntry[]): Route {
  const normalized = pathname.replace(/\/+$/, '')
  if (normalized === '') return { kind: 'landing' }
  const slug = normalized.replace(/^\//, '')
  const entry = registry.find((candidate) => candidate.slug === slug)
  return entry ? { kind: 'presentation', entry } : { kind: 'landing' }
}

/**
 * One React.lazy component per entry. Call this outside render, once, so each component keeps its
 * identity across renders. Creating it does not load anything; the first render does.
 */
export function lazyPresentations(registry: readonly PresentationEntry[]): PresentationComponents {
  return new Map(registry.map((entry) => [entry.slug, lazy(entry.load)]))
}
