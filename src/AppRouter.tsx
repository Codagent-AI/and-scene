import { lazy, Suspense, type ComponentType } from 'react'
import { Landing } from './Landing'
import { resolveRoute } from './router'
import { presentations, type PresentationRegistryEntry } from './presentations'

export interface AppRouterProps {
  pathname: string
  entries?: PresentationRegistryEntry[]
}

const lazyComponentCache = new WeakMap<PresentationRegistryEntry, ComponentType>()

function getLazyComponent(entry: PresentationRegistryEntry): ComponentType {
  const cached = lazyComponentCache.get(entry)
  if (cached) return cached
  const created = lazy(entry.load)
  lazyComponentCache.set(entry, created)
  return created
}

function NotFound() {
  return (
    <main data-presentation-chrome="not-found">
      <p>Not found.</p>
      <a href="/">and-scene</a>
    </main>
  )
}

export function AppRouter({ pathname, entries = presentations }: AppRouterProps) {
  const route = resolveRoute(pathname, entries)

  if (route.type === 'landing') {
    return <Landing entries={entries} />
  }

  if (route.type === 'not-found') {
    return <NotFound />
  }

  // getLazyComponent caches by registry entry, so this always returns the same
  // component identity for a given slug rather than creating one per render.
  const LazyPresentation = getLazyComponent(route.entry)
  return (
    <Suspense fallback={null}>
      {/* eslint-disable-next-line react-hooks/static-components */}
      <LazyPresentation />
    </Suspense>
  )
}
