import type { ComponentType } from 'react'
export interface RegistryEntry { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }
export const presentations: RegistryEntry[] = [
  { slug: 'how-to-make-a-presentation', title: 'How to Use This Skill to Make a Presentation', load: () => import('./how-to-make-a-presentation/Talk') },
]
export function findPresentation(path: string, entries = presentations) {
  return entries.find(entry => `/${entry.slug}` === path.replace(/\/$/, ''))
}
