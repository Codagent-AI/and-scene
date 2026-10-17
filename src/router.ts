import type { PresentationEntry } from './presentations/index.ts'

export type Route =
  | { kind: 'landing' }
  | { kind: 'presentation'; entry: PresentationEntry }

/** "/" and any unknown path show the landing page; "/<slug>" (trailing slash allowed) opens a presentation. */
export function resolveRoute(pathname: string, registry: readonly PresentationEntry[]): Route {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  const entry = slug ? registry.find((e) => e.slug === slug) : undefined
  return entry ? { kind: 'presentation', entry } : { kind: 'landing' }
}
