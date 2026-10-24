import type { PresentationEntry } from './presentations'

export type Route =
  | { kind: 'landing' }
  | { kind: 'presentation'; entry: PresentationEntry }

/** "/" and unknown paths show the landing page; "/<slug>" opens that presentation. */
export function resolveRoute(pathname: string, registry: ReadonlyArray<PresentationEntry>): Route {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  const entry = slug === '' ? undefined : registry.find((e) => e.slug === slug)
  return entry ? { kind: 'presentation', entry } : { kind: 'landing' }
}
