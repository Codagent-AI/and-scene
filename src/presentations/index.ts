import type { ComponentType } from 'react'

export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

// Explicit and reviewable: add a folder plus one entry here per presentation.
export const presentations: PresentationEntry[] = [
  { slug: 'how-to-make-a-presentation', title: 'How to Use This Skill to Make a Presentation',
    load: () => import('./how-to-make-a-presentation/Talk') },
]
