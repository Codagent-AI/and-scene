import type { PresentationEntry } from './presentations/index.ts'

export type Route =
  | { kind: 'landing' }
  | { kind: 'presentation'; entry: PresentationEntry }

/** "/" is the landing page, "/<slug>" a registered presentation, anything else lands home. */
export function resolveRoute(pathname: string, registry: readonly PresentationEntry[]): Route {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  const entry = slug === '' ? undefined : registry.find((e) => e.slug === slug)
  return entry ? { kind: 'presentation', entry } : { kind: 'landing' }
}
