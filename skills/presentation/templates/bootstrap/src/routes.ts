import { lazy } from 'react'
import type { PresentationEntry } from './presentations'

export function createRoutes(entries: readonly PresentationEntry[]) {
  return entries.map(entry => ({ ...entry, component: lazy(entry.load) }))
}

export type PresentationRoute = ReturnType<typeof createRoutes>[number]
