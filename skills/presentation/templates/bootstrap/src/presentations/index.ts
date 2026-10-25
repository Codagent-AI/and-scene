import { lazy } from 'react'
import type { ComponentType } from 'react'
export interface RegistryEntry { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }
export const presentations: RegistryEntry[] = [
  { slug: 'starter', title: 'Your presentation', load: () => import('./starter/Talk') },
]
export function findPresentation<T extends RegistryEntry>(path: string, entries: readonly T[]) { return entries.find(entry => `/${entry.slug}` === path.replace(/\/$/, '')) }

export function presentationRoutes(entries: readonly RegistryEntry[]) {
  return entries.map(entry => ({ ...entry, Component: lazy(entry.load) }))
}
export const routes = presentationRoutes(presentations)
