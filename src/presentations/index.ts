import type { PresentationEntry } from './types'

// Explicit registry. Adding a presentation means a new folder plus one line here.
export const PRESENTATIONS: PresentationEntry[] = [
  {
    slug: 'how-to-make-a-presentation',
    title: 'How to Use This Skill to Make a Presentation',
    load: () => import('./how-to-make-a-presentation/Talk'),
  },
]

export type { PresentationEntry } from './types'
