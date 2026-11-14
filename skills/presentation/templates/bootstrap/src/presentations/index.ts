import type { ComponentType } from 'react'
export interface RegistryEntry { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }
export const presentations: RegistryEntry[] = [{ slug: 'example', title: 'Your topic', load: () => import('./example/Talk') }]
export function findPresentation(pathname: string, entries = presentations) { return entries.find(entry => `/${entry.slug}` === pathname.replace(/\/$/, '')) }
