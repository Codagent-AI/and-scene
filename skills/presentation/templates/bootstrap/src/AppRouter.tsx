import { lazy, Suspense } from 'react'
import { Landing } from './Landing'
import { presentations } from './presentations'

const routes = presentations.map((entry) => ({ ...entry, Component: lazy(entry.load) }))

export function AppRouter() {
  const slug = window.location.pathname.replace(/^\/+|\/+$/g, '')
  const route = routes.find((presentation) => presentation.slug === slug)
  if (!route) return <Landing />
  const RoutePresentation = route.Component
  return <Suspense fallback={<main data-presentation-loading="true">Loading presentation…</main>}><RoutePresentation /></Suspense>
}
