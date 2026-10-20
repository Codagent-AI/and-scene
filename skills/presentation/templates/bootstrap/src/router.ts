import type { PresentationEntry } from './presentations/index.ts'

/** "/" and any unknown path map to the landing page; "/<slug>" to its presentation. */
export function resolveRoute(pathname: string, entries: readonly PresentationEntry[]): PresentationEntry | null {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  return entries.find((entry) => entry.slug === slug) ?? null
}
