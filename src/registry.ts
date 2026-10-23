import type { ComponentType } from 'react'

export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

export type Route = { kind: 'landing' } | { kind: 'presentation'; entry: PresentationEntry }

/** Maps a pathname to Landing, or to the registry entry for `/<slug>`. Unknown paths fall back to Landing. */
export function resolveRoute(pathname: string, registry: readonly PresentationEntry[]): Route {
  const normalized = pathname.replace(/\/+$/, '')
  if (normalized === '') return { kind: 'landing' }
  const slug = normalized.replace(/^\//, '')
  const entry = registry.find((candidate) => candidate.slug === slug)
  return entry ? { kind: 'presentation', entry } : { kind: 'landing' }
}
