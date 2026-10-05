import type { PresentationRegistration } from './presentations'

export function resolvePresentationRoute(pathname: string, entries: readonly PresentationRegistration[]) {
  let slug: string
  try {
    slug = decodeURIComponent(pathname.replace(/^\/+|\/+$/g, ''))
  } catch {
    return undefined
  }
  return entries.find((entry) => entry.slug === slug)
}
