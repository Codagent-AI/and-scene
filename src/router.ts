import type { ComponentType } from 'react'

export interface PresentationRegistryEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

export type Route =
  | { kind: 'landing' }
  | { kind: 'presentation'; entry: PresentationRegistryEntry }

export function resolveRoute(
  pathname: string,
  registry: PresentationRegistryEntry[],
): Route {
  const slug = pathname.replace(/^\/+/, '').replace(/\/+$/, '')
  if (!slug) return { kind: 'landing' }

  const entry = registry.find((candidate) => candidate.slug === slug)
  return entry ? { kind: 'presentation', entry } : { kind: 'landing' }
}
