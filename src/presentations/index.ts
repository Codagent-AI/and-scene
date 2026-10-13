import type { ComponentType } from 'react'

export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

// Keep presentation routes explicit and reviewable.
export const presentations: PresentationEntry[] = [
  { slug: 'how-to-make-a-presentation', title: 'How to Use This Skill to Make a Presentation', load: () => import('./how-to-make-a-presentation/Talk') },
]

export function presentationForPath(pathname: string, entries: PresentationEntry[] = presentations) {
  const slug = pathname.split('/').filter(Boolean)
  if (slug.length !== 1) return undefined
  return entries.find(entry => entry.slug === slug[0])
}
