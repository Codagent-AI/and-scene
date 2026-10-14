import type { ComponentType } from 'react'

/** One registered presentation. Its entry module default-exports the Talk component. */
export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}
