import type { ComponentType } from 'react'

export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Throws on duplicate/invalid slugs or empty titles. */
export function validateRegistry(entries: readonly PresentationEntry[]): void {
  const seen = new Set<string>()
  for (const e of entries) {
    if (!SLUG.test(e.slug)) throw new Error(`Invalid presentation slug: "${e.slug}"`)
    if (seen.has(e.slug)) throw new Error(`Duplicate presentation slug: "${e.slug}"`)
    if (e.title.trim() === '') throw new Error(`Presentation "${e.slug}" has an empty title`)
    seen.add(e.slug)
  }
}

/** Explicit registry: add a presentation = new folder + one line here. */
export const presentations: PresentationEntry[] = [
  // { slug: 'my-talk', title: 'My Talk', load: () => import('./my-talk/Talk') },
]
