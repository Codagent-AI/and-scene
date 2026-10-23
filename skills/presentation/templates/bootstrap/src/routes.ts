import type { PresentationEntry } from './presentations'

/** Maps a pathname to a registry entry, or null for the landing page. */
export function resolveRoute(
  pathname: string,
  registry: readonly PresentationEntry[],
): PresentationEntry | null {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  return registry.find((entry) => entry.slug === slug) ?? null
}
