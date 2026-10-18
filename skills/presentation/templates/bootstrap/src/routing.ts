import type { PresentationEntry } from './presentations'

/** Slug for a `/<slug>` pathname, or null for the landing page and unknown shapes. */
export function slugFromPathname(pathname: string): string | null {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  return slug === '' || slug.includes('/') ? null : decodeURIComponent(slug)
}

export function resolveEntry(pathname: string, registry: readonly PresentationEntry[]): PresentationEntry | null {
  const slug = slugFromPathname(pathname)
  return registry.find((e) => e.slug === slug) ?? null
}
