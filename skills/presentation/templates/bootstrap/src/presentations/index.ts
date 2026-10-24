import type { ComponentType } from 'react'

export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

/**
 * Explicit registry: adding a presentation is a new folder plus one entry here.
 */
export const presentations: PresentationEntry[] = [
  {
    slug: 'starter',
    title: 'Starter presentation',
    load: () => import('./starter/Talk.tsx'),
  },
]
