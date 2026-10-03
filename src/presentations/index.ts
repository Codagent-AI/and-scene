import type { ComponentType } from 'react'

export type PresentationModule = { default: ComponentType }
export type PresentationEntry = { slug: string; title: string; load: () => Promise<PresentationModule> }

export const presentations: PresentationEntry[] = [
  { slug: 'how-to-make-a-presentation', title: 'How to Use This Skill to Make a Presentation', load: () => import('./how-to-make-a-presentation/Talk') },
]
