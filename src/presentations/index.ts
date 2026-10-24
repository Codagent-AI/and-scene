import type { ComponentType } from 'react'
export interface PresentationEntry { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }
export const presentations: readonly PresentationEntry[] = [
  { slug: 'how-to-make-a-presentation', title: 'How to Use This Skill to Make a Presentation', load: () => import('./how-to-make-a-presentation/Talk') },
]
export function findPresentation(pathname: string, entries = presentations) {
  return entries.find(entry => `/${entry.slug}` === pathname.replace(/\/$/, ''))
}
