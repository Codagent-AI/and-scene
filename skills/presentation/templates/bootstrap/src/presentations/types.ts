import type { ComponentType } from 'react'

export interface PresentationEntry {
  /** URL path segment: the presentation lives at `/<slug>`. */
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}
