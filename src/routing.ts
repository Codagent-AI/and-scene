import type { ComponentType } from 'react'

export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

export function presentationPath(slug: string) {
  return `/${encodeURIComponent(slug)}`
}

export function findPresentation(pathname: string, registry: readonly PresentationEntry[]) {
  return registry.find(entry => pathname === presentationPath(entry.slug) || pathname === `${presentationPath(entry.slug)}/`)
}
