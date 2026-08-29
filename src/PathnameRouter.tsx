/* eslint-disable react-hooks/static-components -- registry loaders are cached by identity. */
import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react'
import { Landing } from './Landing'
import type { PresentationRegistration } from './presentations'
import { pathnameToSlug } from './routing'

const lazyRoutes = new Map<PresentationRegistration['load'], LazyExoticComponent<ComponentType>>()

function routeFor(load: PresentationRegistration['load']) {
  let route = lazyRoutes.get(load)
  if (!route) {
    route = lazy(load)
    lazyRoutes.set(load, route)
  }
  return route
}

interface PathnameRouterProps {
  pathname: string
  presentations: readonly PresentationRegistration[]
}

export function PathnameRouter({ pathname, presentations }: PathnameRouterProps) {
  const slug = pathnameToSlug(pathname)
  const entry = slug ? presentations.find((presentation) => presentation.slug === slug) : undefined

  if (!entry) return <Landing presentations={presentations} />

  const PresentationRoute = routeFor(entry.load)
  return (
    <Suspense fallback={<main data-presentation-loading="true">Loading presentation…</main>}>
      <PresentationRoute />
    </Suspense>
  )
}
