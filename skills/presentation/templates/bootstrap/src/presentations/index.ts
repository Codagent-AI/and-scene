import type { ComponentType } from 'react'

export interface PresentationRegistration {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

export const presentations: PresentationRegistration[] = [
  { slug: 'example', title: 'A first evolving scene', load: () => import('./example/Talk') },
]
