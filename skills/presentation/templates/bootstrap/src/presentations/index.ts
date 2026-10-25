import type { ComponentType } from 'react'
export interface RegistryEntry { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }
export const presentations: readonly RegistryEntry[] = [
  { slug: 'example', title: 'Example presentation', load: () => import('./example/Talk') },
]
export function resolvePresentation(pathname: string, entries = presentations) { return entries.find(entry => pathname === `/${entry.slug}` || pathname === `/${entry.slug}/`) }
