import type { PresentationEntry } from './presentations'

/** The registry entry for a pathname like "/my-talk", or undefined for "/" and unknown paths. */
export function resolveEntry(
  pathname: string,
  registry: readonly PresentationEntry[],
): PresentationEntry | undefined {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  return slug ? registry.find((entry) => entry.slug === slug) : undefined
}
