import type { PresentationRegistryEntry } from './presentations'

export type Route =
  | { type: 'landing' }
  | { type: 'presentation'; entry: PresentationRegistryEntry }
  | { type: 'not-found'; pathname: string }

export function resolveRoute(pathname: string, entries: PresentationRegistryEntry[]): Route {
  const slug = pathname.replace(/^\/+/, '').replace(/\/+$/, '')
  if (slug === '') return { type: 'landing' }
  const entry = entries.find((candidate) => candidate.slug === slug)
  if (entry) return { type: 'presentation', entry }
  return { type: 'not-found', pathname }
}
