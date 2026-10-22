import type { ComponentType } from 'react'

export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Returns human-readable problems; an empty list means the registry is sound. */
export function validateRegistry(entries: readonly Partial<PresentationEntry>[]): string[] {
  const problems: string[] = []
  const seen = new Set<string>()
  entries.forEach((entry, index) => {
    const { slug, title, load } = entry
    if (typeof slug !== 'string' || !SLUG.test(slug)) problems.push(`entry ${index}: invalid slug "${String(slug)}"`)
    else if (seen.has(slug)) problems.push(`entry ${index}: duplicate slug "${slug}"`)
    else seen.add(slug)
    if (typeof title !== 'string' || title.trim() === '') problems.push(`entry ${index}: missing title`)
    if (typeof load !== 'function') problems.push(`entry ${index}: missing loader`)
  })
  return problems
}

/** Route lookup: `/` and unknown paths resolve to the landing page. */
export function resolveRoute(
  pathname: string,
  registry: readonly PresentationEntry[],
): { kind: 'landing' } | { kind: 'presentation'; entry: PresentationEntry } {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  const entry = slug === '' ? undefined : registry.find((e) => e.slug === slug)
  return entry ? { kind: 'presentation', entry } : { kind: 'landing' }
}
