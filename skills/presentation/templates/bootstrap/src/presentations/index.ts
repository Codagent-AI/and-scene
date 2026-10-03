import type { ComponentType } from 'react'

export interface PresentationRegistryEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

/**
 * Explicit presentation registry. Adding a presentation is a new folder plus
 * one entry here — deterministic and diffable, unlike glob-based
 * auto-registration.
 */
export const presentations: PresentationRegistryEntry[] = []
