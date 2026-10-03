import type { PresentationEntry } from './presentations'

export type Route =
  | { kind: 'landing' }
  | { kind: 'presentation'; entry: PresentationEntry }

export function resolveRoute(pathname: string, registry: readonly PresentationEntry[]): Route {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  const entry = slug ? registry.find((p) => p.slug === slug) : undefined
  return entry ? { kind: 'presentation', entry } : { kind: 'landing' }
}
