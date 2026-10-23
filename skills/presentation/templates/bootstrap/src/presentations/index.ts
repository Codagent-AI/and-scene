import type { PresentationEntry } from '../registry'

/** Explicit registry: adding a presentation means a new folder and one line here. */
export const PRESENTATIONS: readonly PresentationEntry[] = [
  {
    slug: 'starter',
    title: 'Starter presentation',
    load: () => import('./starter/Talk'),
  },
]
