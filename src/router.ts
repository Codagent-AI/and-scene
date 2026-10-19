import type { PresentationEntry } from './presentations'

export type Route = { kind: 'landing' } | { kind: 'presentation'; entry: PresentationEntry }

/** "/" and unknown paths render the landing page; "/<slug>" renders that presentation. */
export function resolveRoute(pathname: string, registry: readonly PresentationEntry[]): Route {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  const entry = registry.find((e) => e.slug === slug)
  return entry ? { kind: 'presentation', entry } : { kind: 'landing' }
}
