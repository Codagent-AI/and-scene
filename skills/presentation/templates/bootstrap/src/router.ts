import type { PresentationEntry } from './presentations'

export type PresentationRoute = { kind: 'landing' } | { entry: PresentationEntry; kind: 'presentation' }

export function resolvePresentationRoute(pathname: string, entries: readonly PresentationEntry[]): PresentationRoute {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  const entry = entries.find((candidate) => candidate.slug === slug)
  return entry ? { entry, kind: 'presentation' } : { kind: 'landing' }
}
