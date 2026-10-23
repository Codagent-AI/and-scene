import type { ComponentType } from 'react'

export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

/** Explicit registry: adding a presentation is one folder plus one line here. */
export const presentations: PresentationEntry[] = [
  {
    slug: 'starter',
    title: 'Starter Presentation',
    load: () => import('./starter/Talk.tsx'),
  },
]
