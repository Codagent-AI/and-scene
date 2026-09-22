import type { ComponentType } from 'react'

export type PresentationRegistration = {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

export const presentations: PresentationRegistration[] = [
  { slug: 'starter', title: 'A new presentation', load: () => import('./starter/Talk') },
]
