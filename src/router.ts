import type { PresentationEntry } from './presentations/types.ts'

export type Route =
  | { kind: 'landing' }
  | { kind: 'presentation'; entry: PresentationEntry }
  | { kind: 'not-found'; path: string }

/** "/" is the landing page, "/<slug>" a registered presentation, anything else not found. */
export function resolveRoute(pathname: string, registry: readonly PresentationEntry[]): Route {
  const path = pathname.replace(/\/+$/, '')
  if (path === '') return { kind: 'landing' }
  let slug: string
  try {
    slug = decodeURIComponent(path.replace(/^\//, ''))
  } catch {
    return { kind: 'not-found', path: pathname } // malformed escape such as /%FF
  }
  const entry = registry.find((e) => e.slug === slug)
  return entry ? { kind: 'presentation', entry } : { kind: 'not-found', path: pathname }
}
