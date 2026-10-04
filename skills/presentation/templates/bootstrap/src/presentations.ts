import type { ComponentType } from 'react'
export type PresentationEntry = { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }
export const presentations: PresentationEntry[] = [
  { slug: 'example', title: 'A Small Example', load: () => import('./presentations/example/Talk') },
]
