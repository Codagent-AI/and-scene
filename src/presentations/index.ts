import type { ComponentType } from 'react'

export interface PresentationRegistration {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

export const presentations: readonly PresentationRegistration[] = []

export function resolvePresentation(
  pathname: string,
  registry: readonly PresentationRegistration[] = presentations,
) {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  return slug.includes('/') ? undefined : registry.find((presentation) => presentation.slug === slug)
}
