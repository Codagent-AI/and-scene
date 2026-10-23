import type { PresentationEntry } from './types'

/** Explicit registry: one route per presentation. Adding one is one line here. */
export const PRESENTATIONS: readonly PresentationEntry[] = [
  {
    slug: 'how-to-make-a-presentation',
    title: 'How to Use This Skill to Make a Presentation',
    load: () => import('./how-to-make-a-presentation/Talk'),
  },
]
