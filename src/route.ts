import { presentations } from './presentations'
import type { PresentationEntry } from './presentations'

/** Resolves a pathname to a registry entry; `undefined` means the landing page. */
export function resolveRoute(
  pathname: string,
  registry: readonly PresentationEntry[] = presentations,
): PresentationEntry | undefined {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  return slug ? registry.find((p) => p.slug === slug) : undefined
}
