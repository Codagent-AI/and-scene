import type { PresentationEntry } from './presentations'

export function resolvePresentationRoute(pathname: string, entries: readonly PresentationEntry[]) {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  return slug ? entries.find(entry => entry.slug === slug) : undefined
}
