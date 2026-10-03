import type { ComponentType } from 'react'
export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType<Record<string, never>> }>
}

export const presentations: PresentationEntry[] = [
  { slug: 'starter', title: 'Your starter presentation', load: () => import('./starter/Talk') },
]
