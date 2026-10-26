import type { ComponentType } from 'react'
export interface RegistryEntry { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }
export function resolvePresentation(path: string, entries: readonly RegistryEntry[]) { return entries.find(entry => path === `/${entry.slug}` || path === `/${entry.slug}/`) }
