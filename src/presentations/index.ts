import { lazy } from 'react'
import type { ComponentType, LazyExoticComponent } from 'react'

export interface PresentationRegistration {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

export interface RegisteredPresentation extends PresentationRegistration {
  Component: LazyExoticComponent<ComponentType>
}

export function definePresentation(registration: PresentationRegistration): RegisteredPresentation {
  return { ...registration, Component: lazy(registration.load) }
}

export const presentations: readonly RegisteredPresentation[] = [
  definePresentation({
    slug: 'how-to-make-a-presentation',
    title: 'How to Use This Skill to Make a Presentation',
    load: () => import('./how-to-make-a-presentation/Talk'),
  }),
]
