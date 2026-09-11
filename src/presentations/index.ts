import type { ComponentType } from 'react'

export type PresentationRegistryEntry = {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

export const PRESENTATIONS: PresentationRegistryEntry[] = [
  {
    slug: 'how-to-make-a-presentation',
    title: 'How to Use This Skill to Make a Presentation',
    load: () => import('./how-to-make-a-presentation/Talk.tsx'),
  },
]

export const presentationRegistry = PRESENTATIONS
