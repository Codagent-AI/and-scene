import type { ComponentType } from 'react'

export type PresentationEntry = {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

export const presentationRegistry: readonly PresentationEntry[] = [
  {
    slug: 'how-to-make-a-presentation',
    title: 'How to Use This Skill to Make a Presentation',
    load: () => import('./how-to-make-a-presentation/Talk'),
  },
]
