import type { PresentationEntry } from './presentations/index.ts'

export type Route =
  | { kind: 'landing' }
  | { kind: 'presentation'; entry: PresentationEntry }

/** "/" and unknown paths show the landing page; "/<slug>" shows that presentation. */
export function resolveRoute(pathname: string, entries: readonly PresentationEntry[]): Route {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  const entry = slug === '' ? undefined : entries.find((e) => e.slug === slug)
  return entry ? { kind: 'presentation', entry } : { kind: 'landing' }
}
