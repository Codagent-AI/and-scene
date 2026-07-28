import type { PresentationRegistryEntry } from './presentations'

export type Route = { type: 'landing' } | { type: 'presentation'; slug: string } | { type: 'not-found' }

/**
 * Resolves a pathname to a route against the presentation registry. "/"
 * resolves to the landing page; "/<slug>" resolves to a registered
 * presentation; anything else is not-found (the caller falls back to the
 * landing page).
 */
export function resolveRoute(pathname: string, registry: PresentationRegistryEntry[]): Route {
  const normalized = pathname.replace(/\/+$/, '') || '/'
  if (normalized === '/') {
    return { type: 'landing' }
  }

  const slug = normalized.slice(1)
  const match = registry.some((entry) => entry.slug === slug)
  return match ? { type: 'presentation', slug } : { type: 'not-found' }
}
