import { lazy, Suspense, useMemo } from 'react'
import { Landing } from './Landing'
import { findPresentation, presentations } from './presentations'
import type { RegistryEntry } from './presentations'
export function Router({ path = window.location.pathname, entries = presentations }: { path?: string; entries?: RegistryEntry[] }) {
  const entry = findPresentation(path, entries)
  const Talk = useMemo(() => entry ? lazy(entry.load) : null, [entry])
  return Talk ? <Suspense fallback={<p role="status">Loading presentation…</p>}><Talk /></Suspense> : <Landing />
}
