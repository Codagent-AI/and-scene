import type { ComponentType } from 'react'

export interface RegistryEntry {
  slug: string
  title: string
  // Loads the module whose default export renders the presentation.
  load: () => Promise<{ default: ComponentType }>
}

export type Route =
  | { kind: 'landing' }
  | { kind: 'presentation'; entry: RegistryEntry }

/** "/" and unknown paths show the landing page; "/<slug>" opens that presentation. */
export function resolveRoute(pathname: string, registry: readonly RegistryEntry[]): Route {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  const entry = registry.find((e) => e.slug === slug)
  return entry ? { kind: 'presentation', entry } : { kind: 'landing' }
}
