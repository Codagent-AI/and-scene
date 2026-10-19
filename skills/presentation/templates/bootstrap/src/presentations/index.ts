import type { PresentationEntry } from './registry'

/** Explicit registry: adding a presentation = new folder + one line here. */
export const presentations: readonly PresentationEntry[] = [
  {
    slug: 'starter',
    title: 'Starter presentation',
    load: () => import('./starter/Talk'),
  },
]
