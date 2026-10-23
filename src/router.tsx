import { createElement, lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react'
import { resolveRoute } from './resolveRoute.ts'
import Landing from './Landing.tsx'
import type { PresentationEntry } from './presentations/index.ts'

const lazyByEntry = new WeakMap<PresentationEntry, LazyExoticComponent<ComponentType>>()

function lazyFor(entry: PresentationEntry) {
  let component = lazyByEntry.get(entry)
  if (!component) lazyByEntry.set(entry, (component = lazy(entry.load)))
  return component
}

export function Router({ pathname, registry }: { pathname: string; registry: readonly PresentationEntry[] }) {
  const entry = resolveRoute(pathname, registry)
  if (!entry) return <Landing registry={registry} />
  return (
    <Suspense fallback={null}>
      {createElement(lazyFor(entry))}
    </Suspense>
  )
}
