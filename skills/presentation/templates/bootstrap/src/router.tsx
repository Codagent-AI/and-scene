import { createElement, Suspense } from 'react'
import type { ComponentType } from 'react'
import { Landing } from './Landing'
import { presentationComponents, presentations as registeredPresentations } from './presentations'
import type { PresentationRegistration } from './presentations'
import { routeForPathname } from './routing'

interface AppRouterProps { pathname?: string; presentations?: readonly PresentationRegistration[]; components?: ReadonlyMap<string, ComponentType> }

export function AppRouter({ pathname = window.location.pathname, presentations = registeredPresentations, components = presentationComponents }: AppRouterProps) {
  const entry = routeForPathname(pathname, presentations)
  if (!entry) return <Landing />
  const PresentationComponent = components.get(entry.slug)
  if (!PresentationComponent) return <Landing />
  return <Suspense fallback={<main data-presentation-loading>Loading presentation…</main>}>{createElement(PresentationComponent)}</Suspense>
}
