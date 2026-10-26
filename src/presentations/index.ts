import { lazy } from 'react'
import type { ComponentType } from 'react'

export interface PresentationRegistration {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

export const presentations: readonly PresentationRegistration[] = [
  {
    slug: 'how-to-make-a-presentation',
    title: 'How to Use This Skill to Make a Presentation',
    load: () => import('./how-to-make-a-presentation/Talk'),
  },
]

export const presentationComponents = new Map(
  presentations.map((presentation) => [presentation.slug, lazy(presentation.load)]),
)
