import type { ComponentType } from 'react'

export interface PresentationRegistryEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

export const presentations: PresentationRegistryEntry[] = []

export function findPresentation(slug: string): PresentationRegistryEntry | undefined {
  return presentations.find((entry) => entry.slug === slug)
}
