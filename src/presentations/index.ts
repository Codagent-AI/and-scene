import type { ComponentType } from 'react'

export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

/**
 * Explicit registry: adding a presentation is a new folder plus one line here,
 * e.g. `{ slug: 'my-talk', title: 'My Talk', load: () => import('./my-talk/Talk') }`.
 */
export const presentations: readonly PresentationEntry[] = [
  {
    slug: 'how-to-make-a-presentation',
    title: 'How to Use This Skill to Make a Presentation',
    load: () => import('./how-to-make-a-presentation/Talk'),
  },
]
