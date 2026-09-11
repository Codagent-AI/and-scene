import type { ComponentType } from 'react'

export type PresentationRegistryEntry = {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

export const PRESENTATIONS: PresentationRegistryEntry[] = []

export const presentationRegistry = PRESENTATIONS
