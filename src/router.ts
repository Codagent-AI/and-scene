import { presentations as registry } from './presentations'
import type { PresentationEntry } from './presentations'

export type Route =
  | { kind: 'landing' }
  | { kind: 'presentation'; entry: PresentationEntry }

/** "/" → landing, "/<slug>" → that presentation, anything unknown → landing. */
export function resolveRoute(pathname: string, entries: readonly PresentationEntry[] = registry): Route {
  const slug = pathname.split('/').filter(Boolean)[0]
  const entry = slug ? entries.find((e) => e.slug === slug) : undefined
  return entry ? { kind: 'presentation', entry } : { kind: 'landing' }
}
