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
export const presentations: PresentationRegistryEntry[] = [
  {
    slug: 'how-to-make-a-presentation',
    title: 'How to Use This Skill to Make a Presentation',
    load: () => import('./how-to-make-a-presentation/Talk'),
  },
]
