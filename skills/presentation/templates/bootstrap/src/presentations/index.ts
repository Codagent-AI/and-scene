import type { ComponentType } from 'react'

export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

/** Explicit registry: a new presentation is one folder plus one line here. */
export const presentations: readonly PresentationEntry[] = [
]
