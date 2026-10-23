import type { ComponentType } from 'react'

export interface PresentationEntry {
  /** URL slug: the presentation is served at `/<slug>` and lives in `./<slug>/`. */
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}
