import { lazy, Suspense, type ComponentType } from 'react'
import Landing from './Landing'
import { presentations } from './presentations'
import type { PresentationEntry } from './presentations/types'
import { resolveRoute } from './router'

const lazyCache = new Map<string, ComponentType>()

// Loaders run only for the selected route, never for the whole registry.
function lazyFor(entry: PresentationEntry): ComponentType {
  let component = lazyCache.get(entry.slug)
  if (!component) {
    component = lazy(entry.load)
    lazyCache.set(entry.slug, component)
  }
  return component
}

export interface RouterProps {
  pathname?: string
  registry?: readonly PresentationEntry[]
}

export default function Router({ pathname = window.location.pathname, registry = presentations }: RouterProps) {
  const route = resolveRoute(pathname, registry)
  if (route.kind === 'landing') return <Landing registry={registry} />
  // lazyFor returns a cached component, so its identity is stable across renders.
   
  const Talk = lazyFor(route.entry)
  return (
    <Suspense fallback={null}>
      {/* eslint-disable-next-line react-hooks/static-components */}
      <Talk />
    </Suspense>
  )
}
