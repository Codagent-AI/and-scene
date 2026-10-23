import type { PresentationEntry } from './types'

// Explicit registry: adding a presentation is a new folder plus one entry here.
export const presentations: PresentationEntry[] = [
  {
    slug: 'starter',
    title: 'Starter Presentation',
    load: () => import('./starter/Talk'),
  },
]
