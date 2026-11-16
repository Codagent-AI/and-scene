import type { ComponentType } from 'react'
export interface RegistryEntry { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }
export function resolveRoute(path: string, entries: readonly RegistryEntry[]) { return entries.find(p => `/${p.slug}` === path.replace(/\/$/, '')) }
