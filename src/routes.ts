import type { PresentationEntry } from './presentations'
import { presentations } from './presentations'
export function resolveRoute(path: string, entries: readonly PresentationEntry[] = presentations) {
  return entries.find(entry => path.replace(/\/$/, '') === `/${entry.slug}`)
}
