import type { PresentationRegistration } from './presentations'

export function routeForPathname(pathname: string, presentations: readonly PresentationRegistration[]) {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length !== 1) return null
  return presentations.find((presentation) => presentation.slug === parts[0]) ?? null
}
