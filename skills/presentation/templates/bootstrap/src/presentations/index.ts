import type { ComponentType } from 'react'
export interface Registration { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }
export const presentations: readonly Registration[] = [{ slug: 'starter', title: 'Starter', load: () => import('./starter/Talk') }]
