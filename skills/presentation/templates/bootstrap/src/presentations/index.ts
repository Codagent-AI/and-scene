import type { PresentationEntry } from '../routing'

export const presentations: readonly PresentationEntry[] = [
  { slug: 'starter', title: 'Starter presentation', load: () => import('./starter/Talk') },
]
