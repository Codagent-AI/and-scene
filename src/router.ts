import { presentations as registry } from './presentations'
import type { PresentationEntry } from './presentations'

export type Route =
  | { kind: 'landing' }
  | { kind: 'presentation'; entry: PresentationEntry }

/** "/" → landing, "/<slug>" → that presentation, anything else (unknown slug or extra segments) → landing. */
export function resolveRoute(pathname: string, entries: readonly PresentationEntry[] = registry): Route {
  const segments = pathname.split('/').filter(Boolean)
  const entry = segments.length === 1 ? entries.find((e) => e.slug === segments[0]) : undefined
  return entry ? { kind: 'presentation', entry } : { kind: 'landing' }
}
