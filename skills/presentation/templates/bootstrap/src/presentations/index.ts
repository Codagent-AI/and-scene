import type { ComponentType } from 'react'
export interface RegistryEntry { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }
export const presentations: readonly RegistryEntry[] = [{ slug: 'example', title: 'Example', load: () => import('./example/Talk') }]
export function findPresentation(pathname: string, registry = presentations) { return registry.find(entry => '/' + entry.slug === pathname.replace(/\/$/, '')) }
