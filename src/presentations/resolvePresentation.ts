import type { PresentationEntry } from './index'

export function resolvePresentation(pathname: string, entries: readonly PresentationEntry[]) {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  return entries.find((entry) => entry.slug === slug)
}
