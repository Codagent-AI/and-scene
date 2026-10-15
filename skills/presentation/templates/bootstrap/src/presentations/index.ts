import type { ComponentType } from 'react'

export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

/** Explicit registry. Adding a presentation = new folder + one line here. */
export const presentations: PresentationEntry[] = [
  { slug: 'starter', title: 'Starter Presentation', load: () => import('./starter/Talk') },
]
