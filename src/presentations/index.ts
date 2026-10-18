import type { PresentationEntry } from './types'

/** Explicit registry: one line per presentation, deterministic and diffable. */
export const PRESENTATIONS: readonly PresentationEntry[] = [
  {
    slug: 'how-to-make-a-presentation',
    title: 'How to Use This Skill to Make a Presentation',
    load: () => import('./how-to-make-a-presentation/Talk'),
  },
]
