import type { ComponentType } from 'react'

export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

/** Explicit registry: adding a presentation is a new folder plus one line before the marker. */
export const presentations: PresentationEntry[] = [
  {
    slug: 'hello-scene',
    title: 'Hello Scene',
    load: () => import('./hello-scene/Talk'),
  },
  // presentations:end
]
