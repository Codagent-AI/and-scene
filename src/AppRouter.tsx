import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react'
import { Landing } from './Landing'
import type { PresentationRegistration } from './presentation-kit'
import { presentations } from './presentations'

interface AppRouterProps {
  pathname?: string
  registry?: readonly PresentationRegistration[]
}

const lazyPresentations = new WeakMap<PresentationRegistration, LazyExoticComponent<ComponentType>>()

function getPresentationComponent(presentation: PresentationRegistration) {
  const existing = lazyPresentations.get(presentation)
  if (existing) return existing
  const component = lazy(presentation.load)
  lazyPresentations.set(presentation, component)
  return component
}

export function AppRouter({
  pathname = window.location.pathname,
  registry = presentations,
}: AppRouterProps) {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  const presentation = registry.find((entry) => entry.slug === slug)

  if (!presentation) return <Landing presentations={registry} />

  // The cache gives each explicit registration one stable lazy component.
  const Talk = getPresentationComponent(presentation)
  // eslint-disable-next-line react-hooks/static-components
  return <Suspense fallback={<main data-presentation-loading>Loading presentation…</main>}><Talk /></Suspense>
}
