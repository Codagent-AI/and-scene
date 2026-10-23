import type { PresentationEntry } from './presentations/index.ts'

/** `/` and unknown paths resolve to Landing; `/<slug>` resolves to its registry entry. */
export function resolveRoute(
  pathname: string,
  registry: readonly PresentationEntry[],
): PresentationEntry | null {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  return registry.find((entry) => entry.slug === slug) ?? null
}
