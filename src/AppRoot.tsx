import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react'
import { Landing, NotFound } from './Landing'
import { resolveRoute, type PresentationEntry } from './router'

const lazyCache = new WeakMap<PresentationEntry, LazyExoticComponent<ComponentType>>()

function lazyFor(entry: PresentationEntry) {
  let component = lazyCache.get(entry)
  if (!component) lazyCache.set(entry, (component = lazy(entry.load)))
  return component
}

export interface AppRootProps {
  pathname: string
  entries: readonly PresentationEntry[]
}

export function AppRoot({ pathname, entries }: AppRootProps) {
  const route = resolveRoute(pathname, entries)
  if (route.kind === 'presentation') {
    /* eslint-disable react-hooks/static-components -- the lazy component is cached per entry, so its identity is stable */
    const Presentation = lazyFor(route.entry)
    return (
      <Suspense fallback={null}>
        <Presentation />
      </Suspense>
    )
    /* eslint-enable react-hooks/static-components */
  }
  return route.kind === 'landing' ? <Landing entries={entries} /> : <NotFound />
}
