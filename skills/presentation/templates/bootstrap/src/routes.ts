import type { PresentationEntry } from './presentations'

export type Route =
  | { kind: 'landing' }
  | { kind: 'presentation'; entry: PresentationEntry }

/** "/" and unknown paths resolve to the landing page; "/<slug>" to its registry entry. */
export function resolveRoute(pathname: string, registry: readonly PresentationEntry[]): Route {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  if (slug === '') return { kind: 'landing' }
  let decoded = slug
  try {
    decoded = decodeURIComponent(slug)
  } catch {
    return { kind: 'landing' }
  }
  const entry = registry.find((e) => e.slug === decoded)
  return entry ? { kind: 'presentation', entry } : { kind: 'landing' }
}
