import type { ComponentType } from 'react'

export interface PresentationRegistration {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

export const presentations: readonly PresentationRegistration[] = [
  {
    slug: 'how-to-make-a-presentation',
    title: 'How to Use This Skill to Make a Presentation',
    load: () => import('./how-to-make-a-presentation/Talk'),
  },
]

export function resolvePresentation(
  pathname: string,
  registry: readonly PresentationRegistration[] = presentations,
) {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  return slug.includes('/') ? undefined : registry.find((presentation) => presentation.slug === slug)
}
