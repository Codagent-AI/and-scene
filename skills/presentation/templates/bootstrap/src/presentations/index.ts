import type { ComponentType } from 'react'
export interface RegistryEntry { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }
export const presentations: RegistryEntry[] = [{ slug: 'example', title: 'Example', load: () => import('./example/Talk') }]
