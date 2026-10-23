import type { ComponentType } from 'react'

export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

/** Explicit registry: adding a presentation = a new folder + one line here. */
export const presentations: readonly PresentationEntry[] = [
  // { slug: 'my-talk', title: 'My Talk', load: () => import('./my-talk/Talk') },
]
