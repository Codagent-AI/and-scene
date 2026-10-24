import type { ComponentType } from 'react'
export interface PresentationEntry { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }
export const presentations: readonly PresentationEntry[] = [
  { slug: 'starter', title: 'Your presentation', load: () => import('./starter/Talk') },
]
export function findPresentation(pathname: string) { return presentations.find(entry => `/${entry.slug}` === pathname.replace(/\/$/, '')) }
