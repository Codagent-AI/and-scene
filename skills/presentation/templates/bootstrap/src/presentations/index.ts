import type { ComponentType } from 'react'

export interface PresentationRegistration {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

/** Add each presentation explicitly so routes remain deterministic and diffable. */
export const presentations: readonly PresentationRegistration[] = []
