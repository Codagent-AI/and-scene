import type { ComponentType } from 'react'
export interface PresentationEntry { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }
export const presentations: PresentationEntry[] = [
  { slug: 'starter', title: 'Starter presentation', load: () => import('./starter/Talk') },
]
export function presentationForPath(pathname: string, entries: PresentationEntry[] = presentations) {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length !== 1) return undefined
  return entries.find(entry => entry.slug === segments[0])
}
