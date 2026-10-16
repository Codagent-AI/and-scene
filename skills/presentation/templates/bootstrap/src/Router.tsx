import { createElement, lazy, Suspense, type ComponentType } from 'react'
import { Landing } from './Landing'
import { presentations, type PresentationEntry } from './presentations'
import { resolveRoute } from './router'

const lazyCache = new Map<string, ComponentType>()

function lazyFor(entry: PresentationEntry): ComponentType {
  let C = lazyCache.get(entry.slug)
  if (!C) lazyCache.set(entry.slug, (C = lazy(entry.load)))
  return C
}

function LazyPresentation({ entry }: { entry: PresentationEntry }) {
  return createElement(lazyFor(entry))
}

export function Router({
  pathname = window.location.pathname,
  registry = presentations,
}: {
  pathname?: string
  registry?: readonly PresentationEntry[]
}) {
  const route = resolveRoute(pathname, registry)
  if (route.kind === 'landing') return <Landing registry={registry} />
  return (
    <Suspense fallback={null}>
      <LazyPresentation entry={route.entry} />
    </Suspense>
  )
}
