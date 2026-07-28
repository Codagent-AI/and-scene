import type { ComponentType } from 'react'

export interface PresentationRegistryEntry {
  /** URL path segment the presentation is served at, e.g. "how-to-make-a-presentation". */
  slug: string
  /** Display title used on the landing page and as the document title. */
  title: string
  /** Lazily loads the presentation's entry component. */
  load: () => Promise<{ default: ComponentType }>
}

/**
 * Explicit presentation registry. Adding a presentation is a new folder plus
 * one entry here — deterministic and diffable, unlike glob-based
 * auto-registration.
 */
export const presentations: PresentationRegistryEntry[] = []
