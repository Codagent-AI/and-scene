import { lazy } from 'react'
import { presentations } from './presentations'
import type { PresentationEntry } from './presentations'
export function resolveRoute(path: string, entries: PresentationEntry[]) { return entries.find(entry => path === `/${entry.slug}`) }
export function createRoutes(entries: PresentationEntry[]) { return entries.map(entry => ({ ...entry, Page: lazy(entry.load) })) }
export const routes = createRoutes(presentations)
