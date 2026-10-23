import type { PresentationEntry } from './types'

// Explicit registry: one entry per presentation, in a diffable list.
export const presentations: PresentationEntry[] = [
  { slug: 'how-to-make-a-presentation', title: "How to Use This Skill to Make a Presentation", load: () => import('./how-to-make-a-presentation/Talk') },
  // presentations:end
]
