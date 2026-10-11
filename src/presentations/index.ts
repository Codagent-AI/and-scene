import type { ComponentType } from 'react'

export type PresentationModule = { default: ComponentType }
export type PresentationRegistration = { slug: string; title: string; load: () => Promise<PresentationModule> }

export const presentations: readonly PresentationRegistration[] = []

export function resolvePresentation(slug: string) {
  return presentations.find((presentation) => presentation.slug === slug)
}
