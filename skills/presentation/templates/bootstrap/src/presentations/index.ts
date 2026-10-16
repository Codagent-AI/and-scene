import type { ComponentType } from 'react'

export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

/** Explicit registry: one line per presentation, e.g.
 *  { slug: 'my-talk', title: 'My Talk', load: () => import('./my-talk/Talk') } */
export const presentations: PresentationEntry[] = [
  { slug: 'starter', title: 'Starter', load: () => import('./starter/Talk') },
]
