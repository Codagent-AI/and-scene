import type { ComponentType } from 'react'

export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

export const presentations: PresentationEntry[] = [
  { slug: 'starter', title: 'Starter presentation', load: () => import('./starter/Talk') },
]
