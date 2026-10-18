import { createElement, lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react'
import { Landing } from './Landing'
import type { PresentationEntry } from './presentations'
import { resolveEntry } from './routing'

// One lazy component per loader, so re-rendering never recreates (and remounts) a presentation.
const lazyByLoader = new WeakMap<PresentationEntry['load'], LazyExoticComponent<ComponentType>>()

function lazyPresentation(load: PresentationEntry['load']): LazyExoticComponent<ComponentType> {
  let component = lazyByLoader.get(load)
  if (!component) {
    component = lazy(load)
    lazyByLoader.set(load, component)
  }
  return component
}

export interface RouterProps {
  pathname: string
  registry: readonly PresentationEntry[]
}

export function Router({ pathname, registry }: RouterProps) {
  const entry = resolveEntry(pathname, registry)
  if (!entry) return <Landing registry={registry} />
  return <Suspense fallback={null}>{createElement(lazyPresentation(entry.load))}</Suspense>
}
