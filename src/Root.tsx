import { createElement, lazy, Suspense, type ComponentType } from 'react'
import { Landing } from './Landing'
import type { PresentationEntry } from './presentations'
import { resolveRoute } from './route'

const lazyByEntry = new WeakMap<PresentationEntry, ComponentType>()

function lazyPresentation(entry: PresentationEntry): ComponentType {
  let component = lazyByEntry.get(entry)
  if (!component) {
    component = lazy(entry.load)
    lazyByEntry.set(entry, component)
  }
  return component
}

export function Root({
  pathname,
  registry,
}: {
  pathname: string
  registry: readonly PresentationEntry[]
}) {
  const route = resolveRoute(pathname, registry)
  if (route.kind === 'landing') return <Landing registry={registry} />
  return <Suspense fallback={null}>{createElement(lazyPresentation(route.entry))}</Suspense>
}
