import type { PresentationRegistration } from './presentations'

export function resolvePresentationRoute(pathname: string, entries: readonly PresentationRegistration[]) {
  const slug = decodeURIComponent(pathname.replace(/^\/+|\/+$/g, ''))
  return entries.find((entry) => entry.slug === slug)
}
