import type { ComponentType } from 'react'
export type PresentationEntry = { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }
export const presentations: PresentationEntry[] = [
  { slug: 'starter', title: 'Starter presentation', load: () => import('./starter/Talk') },
]
export function isValidRegistry(entries: readonly PresentationEntry[]): boolean {
  return entries.every((entry) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.slug) && Boolean(entry.title.trim()) && typeof entry.load === 'function') && new Set(entries.map((entry) => entry.slug)).size === entries.length
}
