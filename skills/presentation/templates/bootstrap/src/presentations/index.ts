import type { ComponentType } from 'react'

export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

/** Explicit registry: one line per presentation keeps registration diffable. */
export const presentations: PresentationEntry[] = [
  // new presentations are registered above this line
]
