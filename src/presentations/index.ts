import type { ComponentType } from 'react'

export interface PresentationModule { default: ComponentType<Record<string, never>> }
export interface PresentationRegistration { slug: string; title: string; load: () => Promise<PresentationModule> }

export const presentations: readonly PresentationRegistration[] = [
  { slug: 'how-to-make-a-presentation', title: 'How to Use This Skill to Make a Presentation', load: () => import('./how-to-make-a-presentation/Talk') },
]
