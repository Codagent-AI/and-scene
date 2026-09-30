import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react'
import { Landing } from './Landing'
import type { PresentationRegistration } from './presentation-kit'
import { presentations } from './presentations'

const lazyPresentations = new WeakMap<PresentationRegistration, LazyExoticComponent<ComponentType>>()

function getPresentationComponent(presentation: PresentationRegistration) {
  const existing = lazyPresentations.get(presentation)
  if (existing) return existing
  const component = lazy(presentation.load)
  lazyPresentations.set(presentation, component)
  return component
}

export function AppRouter({ pathname = window.location.pathname, registry = presentations }: {
  pathname?: string
  registry?: readonly PresentationRegistration[]
}) {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  const presentation = registry.find((entry) => entry.slug === slug)
  if (!presentation) return <Landing presentations={registry} />
  const Talk = getPresentationComponent(presentation)
  return <Suspense fallback={<main data-presentation-loading>Loading presentation…</main>}><Talk /></Suspense>
}
