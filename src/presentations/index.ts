import type { PresentationEntry } from './types'

// Explicit registry: adding a presentation is a new folder plus one line here.
export const presentations: PresentationEntry[] = [
  {
    slug: 'how-to-make-a-presentation',
    title: 'How to Use This Skill to Make a Presentation',
    load: () => import('./how-to-make-a-presentation/Talk'),
  },
]
