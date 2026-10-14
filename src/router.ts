import type { PresentationEntry } from './presentations/types'

export type Route<TEntry extends PresentationEntry> =
  | { kind: 'landing' }
  | { kind: 'presentation'; entry: TEntry }
  | { kind: 'not-found'; pathname: string }

/** Pathname routing with no router dependency. "/" is the landing page. */
export function resolveRoute<TEntry extends PresentationEntry>(
  pathname: string,
  entries: ReadonlyArray<TEntry>,
): Route<TEntry> {
  const normalized = pathname.replace(/\/+$/, '')
  if (normalized === '') return { kind: 'landing' }
  const slug = normalized.replace(/^\//, '')
  const entry = entries.find((candidate) => candidate.slug === slug)
  return entry ? { kind: 'presentation', entry } : { kind: 'not-found', pathname }
}
