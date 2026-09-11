import type { PresentationRegistryEntry } from './presentations/index.ts'

export type PresentationRoute = 'landing' | PresentationRegistryEntry

export function resolvePresentation(
  pathname: string,
  presentations: readonly PresentationRegistryEntry[] = [],
): PresentationRoute {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  if (!slug || slug.includes('/')) return 'landing'
  return presentations.find((presentation) => presentation.slug === slug) ?? 'landing'
}
