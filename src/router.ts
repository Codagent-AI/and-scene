import type { PresentationEntry } from './presentations'

export type PresentationRoute = { kind: 'landing' } | { kind: 'presentation'; entry: PresentationEntry }

export function resolvePresentationRoute(pathname: string, entries: readonly PresentationEntry[]): PresentationRoute {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  if (!slug) return { kind: 'landing' }
  const entry = entries.find((candidate) => candidate.slug === slug)
  return entry ? { kind: 'presentation', entry } : { kind: 'landing' }
}
