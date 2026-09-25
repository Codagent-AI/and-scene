import type { ComponentType } from 'react'

export interface PresentationRegistryEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

export function resolvePresentationRoute(pathname: string, registry: readonly PresentationRegistryEntry[] = presentations) {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  return slug ? registry.find((presentation) => presentation.slug === slug) : undefined
}

export const presentations: PresentationRegistryEntry[] = [
  { slug: 'starter', title: 'A new presentation', load: () => import('./starter/Talk') },
]
