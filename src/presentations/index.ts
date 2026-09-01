import type { ComponentType } from 'react'

export interface PresentationRegistration {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

/** Add one explicit entry for each independently routed presentation. */
export const presentations: readonly PresentationRegistration[] = []
