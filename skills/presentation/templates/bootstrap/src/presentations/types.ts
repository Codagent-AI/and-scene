import type { ComponentType } from 'react'

/** A registered presentation: its route slug, display title, and lazy module loader. */
export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}
