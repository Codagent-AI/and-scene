import type { PresentationEntry } from './presentations'

export function resolveEntry(
  pathname: string,
  entries: readonly PresentationEntry[],
): PresentationEntry | undefined {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  return slug ? entries.find((entry) => entry.slug === slug) : undefined
}
