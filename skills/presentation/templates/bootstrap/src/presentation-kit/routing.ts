import type { PresentationEntry } from '../presentations'

export function resolvePresentation(pathname: string, entries: readonly PresentationEntry[]) {
  const route = pathname.replace(/^\/+|\/+$/g, '')
  return route ? entries.find((presentation) => presentation.slug === route) : undefined
}
