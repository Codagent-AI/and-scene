import type { PresentationEntry } from './presentations'

/** Resolve a pathname to a registry entry; null means show the landing page. */
export function resolveRoute(
  pathname: string,
  registry: readonly PresentationEntry[],
): PresentationEntry | null {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  if (!slug) return null
  return registry.find((p) => p.slug === slug) ?? null
}
