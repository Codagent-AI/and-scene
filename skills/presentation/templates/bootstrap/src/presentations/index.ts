import type { ComponentType } from 'react'
export interface PresentationEntry { slug: string; title: string; load: () => Promise<{default: ComponentType}> }
export const presentations: PresentationEntry[] = [{ slug: 'getting-started', title: 'Your presentation', load: () => import('./getting-started/Talk') }]
export function resolvePresentation(path: string) { return presentations.find(entry => path.replace(/^\/+|\/+$/g,'') === entry.slug) }
