import { lazy } from 'react'
import type { Registration } from './presentations'
// Resolve once, outside React rendering, to preserve lazy component identities.
export const createRoutes = (entries: readonly Registration[]) => entries.map(entry => ({ ...entry, Page: lazy(entry.load) }))
