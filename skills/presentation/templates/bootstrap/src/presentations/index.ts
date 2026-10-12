import type React from 'react'
export interface PresentationEntry { slug: string; title: string; load: () => Promise<{ default: React.ComponentType }> }
export const presentations: PresentationEntry[] = [
  { slug: 'starter', title: 'Your presentation', load: () => import('./starter/Talk') },
]
export function findPresentation(slug: string): PresentationEntry | undefined { return presentations.find((entry) => entry.slug === slug) }
export type RouteResolution = { kind: 'landing' } | { kind: 'presentation'; slug: string }
export function resolveRoute(pathname: string): RouteResolution {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  return slug && findPresentation(slug) ? { kind: 'presentation', slug } : { kind: 'landing' }
}
