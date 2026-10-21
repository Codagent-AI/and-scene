import type { PresentationEntry } from './presentations/types'

/** Slug for a pathname (`/slug` or `/slug/`), or null for the landing page. */
export function resolveSlug(pathname: string, registry: ReadonlyArray<PresentationEntry>): string | null {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  return registry.some((entry) => entry.slug === slug) ? slug : null
}
