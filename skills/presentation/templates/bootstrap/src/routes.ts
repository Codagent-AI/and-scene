import { lazy } from 'react'
import type { PresentationEntry } from './presentations'

export function createRoutes(entries: readonly PresentationEntry[]) {
  return entries.map(({ slug, title, load }) => ({
    slug,
    title,
    Component: lazy(load),
  }))
}

export type PresentationRoute = ReturnType<typeof createRoutes>[number]
