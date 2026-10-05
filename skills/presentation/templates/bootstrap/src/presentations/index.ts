import type { ComponentType } from 'react'

export interface PresentationModule { default: ComponentType }
export interface PresentationRegistration { slug: string; title: string; load: () => Promise<PresentationModule> }

export const presentations: readonly PresentationRegistration[] = [
  { slug: 'example', title: 'A First Presentation', load: () => import('./example/Talk') },
]
