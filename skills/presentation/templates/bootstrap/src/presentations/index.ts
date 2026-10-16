import type { ComponentType } from 'react'

export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

/** Explicit registry: adding a presentation is a new folder plus one line here. */
export const PRESENTATIONS: PresentationEntry[] = [
  {
    slug: 'getting-started',
    title: 'Getting Started',
    load: () => import('./getting-started/Talk.tsx'),
  },
]
