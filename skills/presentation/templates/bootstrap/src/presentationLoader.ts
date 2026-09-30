import type { ComponentType } from 'react'
import type { PresentationEntry } from './presentations'

const pages = new Map<PresentationEntry, Promise<{ default: ComponentType }>>()

export function loadPresentationModule(entry: PresentationEntry) {
  const cached = pages.get(entry)
  if (cached) return cached
  const page = entry.load()
  pages.set(entry, page)
  return page
}
