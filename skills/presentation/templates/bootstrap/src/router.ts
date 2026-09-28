import type { PresentationRegistryEntry } from './presentations'

export type Route =
  | { type: 'landing' }
  | { type: 'presentation'; entry: PresentationRegistryEntry }
  | { type: 'not-found'; pathname: string }

/** Zero-dependency pathname router: "/" -> landing, "/<slug>" -> a registered presentation. */
export function resolveRoute(pathname: string, registry: PresentationRegistryEntry[]): Route {
  const normalized = pathname.replace(/\/+$/, '') || '/'
  if (normalized === '/') {
    return { type: 'landing' }
  }

  const slug = normalized.replace(/^\//, '')
  const entry = registry.find((candidate) => candidate.slug === slug)
  if (entry) {
    return { type: 'presentation', entry }
  }

  return { type: 'not-found', pathname }
}
