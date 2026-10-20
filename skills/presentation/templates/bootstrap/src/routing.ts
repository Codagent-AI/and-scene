import type { PresentationEntry } from './presentations/index.ts'

export type Route =
  | { kind: 'landing' }
  | { kind: 'presentation'; entry: PresentationEntry }

/** "/" and unknown paths show the landing page; "/<slug>" opens that presentation. */
export function resolveRoute(pathname: string, registry: readonly PresentationEntry[]): Route {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  const entry = slug ? registry.find((p) => p.slug === slug) : undefined
  return entry ? { kind: 'presentation', entry } : { kind: 'landing' }
}
