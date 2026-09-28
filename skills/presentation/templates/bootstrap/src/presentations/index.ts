import type { ComponentType } from 'react'

export interface PresentationRegistryEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

/**
 * Explicit registry: one line per presentation. Deliberately not
 * `import.meta.glob` auto-registration, so registration stays deterministic
 * and diffable for evals.
 */
export const presentations: PresentationRegistryEntry[] = []
