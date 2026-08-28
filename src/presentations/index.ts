import type { ComponentType } from 'react'

export type PresentationEntry = {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

export const presentationRegistry: readonly PresentationEntry[] = []
