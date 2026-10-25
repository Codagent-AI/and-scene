import { lazy } from 'react'
import type { ComponentType } from 'react'
export interface RegistryEntry { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }
export const presentations: RegistryEntry[] = [
  { slug: 'how-to-make-a-presentation', title: 'How to Use This Skill to Make a Presentation', load: () => import('./how-to-make-a-presentation/Talk') },
]
export function findPresentation<T extends RegistryEntry>(path: string, entries: readonly T[]) {
  return entries.find(entry => `/${entry.slug}` === path.replace(/\/$/, ''))
}

export function presentationRoutes(entries: readonly RegistryEntry[]) {
  return entries.map(entry => ({ ...entry, Component: lazy(entry.load) }))
}
export const routes = presentationRoutes(presentations)
