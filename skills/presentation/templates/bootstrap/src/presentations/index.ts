import type { ComponentType } from 'react'

export type PresentationEntry = { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }
/** Add one explicit entry for each independently routed presentation. */
export const presentations: PresentationEntry[] = [
  { slug: 'example', title: 'Example presentation', load: () => import('./example/Talk') },
]
