import type { PresentationEntry } from './presentations/index.ts'

/** "/" and unknown paths resolve to null (landing); "/<slug>" to its entry. */
export function resolveRoute(
  pathname: string,
  entries: readonly PresentationEntry[],
): PresentationEntry | null {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  return entries.find((e) => e.slug === slug) ?? null
}
