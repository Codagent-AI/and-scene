import type { PresentationEntry } from './presentations'

export type Route =
  | { kind: 'landing' }
  | { kind: 'presentation'; entry: PresentationEntry }

/** Resolve a pathname against the registry; unknown paths fall back to the landing page. */
export function resolveRoute(pathname: string, registry: readonly PresentationEntry[]): Route {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  if (slug === '') return { kind: 'landing' }
  const entry = registry.find((e) => e.slug === slug)
  return entry ? { kind: 'presentation', entry } : { kind: 'landing' }
}
