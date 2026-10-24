import type { PresentationEntry } from '../router'

export const presentations: PresentationEntry[] = [
  {
    slug: 'getting-started',
    title: 'Getting Started',
    load: () => import('./getting-started/Talk'),
  },
]
