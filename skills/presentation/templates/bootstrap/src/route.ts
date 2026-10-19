import type { PresentationEntry } from './presentations'

export type Route =
  | { kind: 'landing' }
  | { kind: 'presentation'; entry: PresentationEntry }

/** Pathname-only routing: "/" and unknown paths are Landing; "/<slug>" is a presentation. */
export function resolveRoute(pathname: string, registry: readonly PresentationEntry[]): Route {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  const entry = slug ? registry.find((candidate) => candidate.slug === slug) : undefined
  return entry ? { kind: 'presentation', entry } : { kind: 'landing' }
}
