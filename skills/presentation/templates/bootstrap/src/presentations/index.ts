import type React from 'react'
export type PresentationEntry = { slug: string; title: string; load: () => Promise<{ default: React.ComponentType }> }
export const presentations: readonly PresentationEntry[] = [{ slug: 'starter', title: 'Starter presentation', load: () => import('./starter/Talk') }]
