import type { ComponentType } from 'react'
export interface RegistryEntry { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }
export const presentations: RegistryEntry[] = [
  { slug: 'starter', title: 'Your presentation', load: () => import('./starter/Talk') },
]
export function findPresentation(path: string, entries = presentations) { return entries.find(entry => `/${entry.slug}` === path.replace(/\/$/, '')) }
