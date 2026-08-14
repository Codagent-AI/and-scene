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

export const presentations: readonly RegisteredPresentation[] = []
