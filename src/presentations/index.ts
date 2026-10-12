import type { ComponentType } from 'react'

export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

export const presentations: PresentationEntry[] = [
  { slug: 'how-to-make-a-presentation', title: 'How to Use This Skill to Make a Presentation', load: () => import('./how-to-make-a-presentation/Talk') },
]

export function resolvePresentation(pathname: string, entries: readonly PresentationEntry[] = presentations) {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  if (!slug) return undefined
  return entries.find((entry) => entry.slug === slug)
}
