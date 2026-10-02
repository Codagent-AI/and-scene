import type { ComponentType } from 'react'
export interface PresentationRegistryEntry { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }
/** Add one explicit entry for each independently routed presentation. */
export const presentations: PresentationRegistryEntry[] = [
  { slug: 'starter', title: 'Your presentation', load: () => import('./starter/Talk') },
]
