import type { ComponentType } from 'react'
export interface RegistryEntry { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }
export const presentations: readonly RegistryEntry[] = [{ slug: 'welcome', title: 'Welcome', load: () => import('./welcome/Talk') }]
