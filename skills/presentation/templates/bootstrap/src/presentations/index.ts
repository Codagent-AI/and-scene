import type { PresentationEntry } from './types'

/** Explicit registry: adding a presentation is a new folder plus one line here. */
export const presentations: PresentationEntry[] = [
  {
    slug: 'starter',
    title: 'Starter presentation',
    load: () => import('./starter/Talk'),
  },
]
