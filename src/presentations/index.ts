import type { ComponentType } from 'react'

export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

// Keep presentation routes explicit and reviewable. The canonical sample is added in task 02.
export const presentations: PresentationEntry[] = []

export function presentationForPath(pathname: string, entries: PresentationEntry[] = presentations) {
  const slug = pathname.split('/').filter(Boolean)
  if (slug.length !== 1) return undefined
  return entries.find(entry => entry.slug === slug[0])
}
