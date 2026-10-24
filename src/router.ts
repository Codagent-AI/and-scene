export interface RegistryEntry {
  slug: string
  title: string
  load: () => Promise<{ default: React.ComponentType }>
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
