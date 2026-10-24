import type { ComponentType } from 'react'

export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

/** Explicit registry: adding a presentation is a new folder plus one line. */
export const PRESENTATIONS: PresentationEntry[] = [
  {
    slug: 'how-to-make-a-presentation',
    title: 'How to Use This Skill to Make a Presentation',
    load: () => import('./how-to-make-a-presentation/Talk'),
  },
]

export function findPresentation(slug: string): PresentationEntry | undefined {
  return PRESENTATIONS.find((p) => p.slug === slug)
}

export function slugFromPath(pathname: string): string {
  return pathname.replace(/^\/+|\/+$/g, '')
}
