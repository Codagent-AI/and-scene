import type { ComponentType } from 'react'

export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

export const presentations: PresentationEntry[] = []

export function resolvePresentation(pathname: string, entries: readonly PresentationEntry[] = presentations) {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  if (!slug) return undefined
  return entries.find((entry) => entry.slug === slug)
}
