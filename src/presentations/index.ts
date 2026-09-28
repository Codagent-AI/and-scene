import type { ComponentType } from 'react'

export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

/**
 * Explicit, diffable presentation registry. Adding a presentation is a new
 * folder plus one entry here — deliberately not auto-discovered.
 */
export const presentations: PresentationEntry[] = []
