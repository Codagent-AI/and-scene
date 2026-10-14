import type { PresentationEntry } from './types'

// Explicit registry. Adding a presentation means a new folder plus one line here.
// The scaffold script inserts new entries above the marker below; keep it in place.
export const PRESENTATIONS: PresentationEntry[] = [
  {
    slug: 'how-to-make-a-presentation',
    title: 'How to Use This Skill to Make a Presentation',
    load: () => import('./how-to-make-a-presentation/Talk'),
  },
  // @presentation-registry
]

export type { PresentationEntry } from './types'
