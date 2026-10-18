import type { PresentationEntry } from './presentations/types'

export type Route =
  | { kind: 'landing' }
  | { kind: 'presentation'; entry: PresentationEntry }

/** `/` and unknown paths show the landing page; `/<slug>` loads that presentation. */
export function resolveRoute(pathname: string, registry: readonly PresentationEntry[]): Route {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  const entry = registry.find((e) => e.slug === slug)
  return entry ? { kind: 'presentation', entry } : { kind: 'landing' }
}
