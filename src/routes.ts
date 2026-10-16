import type { PresentationEntry } from './presentations/index.ts'

/** Maps a pathname to a registry entry; null means "show the landing page". */
export function resolvePresentation(
  pathname: string,
  registry: readonly PresentationEntry[],
): PresentationEntry | null {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  if (!slug) return null
  return registry.find((entry) => entry.slug === slug) ?? null
}
