import { lazy } from 'react'
import type { ComponentType } from 'react'

export interface PresentationRegistration { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }

export const presentations: readonly PresentationRegistration[] = [
  { slug: 'bootstrap-example', title: 'Bootstrap example', load: () => import('./bootstrap-example/Talk') },
]
export const presentationComponents = new Map(presentations.map((presentation) => [presentation.slug, lazy(presentation.load)]))
