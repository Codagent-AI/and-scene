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
  {
    slug: 'how-to-make-a-presentation',
    title: 'How to Use This Skill to Make a Presentation',
    load: () => import('./how-to-make-a-presentation/Talk'),
  },
]
