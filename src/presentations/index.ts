import type { PresentationEntry } from '../registry'

/** Explicit registry: adding a presentation means a new folder and one line here. */
export const PRESENTATIONS: readonly PresentationEntry[] = [
  {
    slug: 'how-to-make-a-presentation',
    title: 'How to Use This Skill to Make a Presentation',
    load: () => import('./how-to-make-a-presentation/Talk'),
  },
]
