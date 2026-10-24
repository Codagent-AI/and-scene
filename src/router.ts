import type { ComponentType } from 'react'

export interface PresentationEntry {
  /** URL-safe, unique route segment. */
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

export type Route =
  | { kind: 'landing' }
  | { kind: 'presentation'; entry: PresentationEntry }
  | { kind: 'not-found' }

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Returns the problems that make a registry unusable; empty when it is valid. */
export function validateRegistry(entries: readonly PresentationEntry[]): string[] {
  const problems: string[] = []
  const seen = new Set<string>()
  for (const entry of entries) {
    if (!SLUG_PATTERN.test(entry.slug)) problems.push(`invalid slug "${entry.slug}"`)
    if (seen.has(entry.slug)) problems.push(`duplicate slug "${entry.slug}"`)
    seen.add(entry.slug)
    if (!entry.title) problems.push(`missing title for "${entry.slug}"`)
    if (typeof entry.load !== 'function') problems.push(`missing loader for "${entry.slug}"`)
  }
  return problems
}

export function resolveRoute(pathname: string, entries: readonly PresentationEntry[]): Route {
  const path = pathname.replace(/\/+$/, '')
  if (path === '') return { kind: 'landing' }
  const slug = path.slice(1)
  const entry = entries.find((candidate) => candidate.slug === slug)
  return entry ? { kind: 'presentation', entry } : { kind: 'not-found' }
}
