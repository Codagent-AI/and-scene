import type { PresentationEntry } from './presentations'

/** Map a pathname to a registry entry; `null` means the landing page. */
export function resolveRoute(
  pathname: string,
  registry: readonly PresentationEntry[],
): PresentationEntry | null {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  return registry.find((entry) => entry.slug === slug) ?? null
}
