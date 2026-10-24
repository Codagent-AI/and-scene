import type { ComponentType } from 'react'

export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

/** Explicit registry: adding a presentation is a new folder plus one line. */
export const PRESENTATIONS: PresentationEntry[] = [
]

export function findPresentation(slug: string): PresentationEntry | undefined {
  return PRESENTATIONS.find((p) => p.slug === slug)
}

export function slugFromPath(pathname: string): string {
  return pathname.replace(/^\/+|\/+$/g, '')
}
