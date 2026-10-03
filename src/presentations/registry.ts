import type { PresentationEntry } from './index'

export function resolvePresentation(pathname: string, entries: readonly PresentationEntry[]) {
  const slug = pathname.split('/').filter(Boolean)[0]
  return slug ? entries.find((entry) => entry.slug === slug) : undefined
}
