import type { ComponentType } from 'react'
import type { PresentationEntry } from './presentations'

const presentationPages = new Map<PresentationEntry, Promise<{ default: ComponentType }>>()

export function loadPresentationModule(entry: PresentationEntry) {
  const existing = presentationPages.get(entry)
  if (existing) return existing
  const page = entry.load()
  presentationPages.set(entry, page)
  return page
}

export function resetPresentationModule(entry: PresentationEntry) {
  presentationPages.delete(entry)
}
