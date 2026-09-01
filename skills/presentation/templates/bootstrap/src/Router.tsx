import { createElement, lazy, Suspense } from 'react'
import Landing from './Landing'
import { presentations, type PresentationRegistration } from './presentations'

export function createAppRouter(entries: readonly PresentationRegistration[]) {
  const routes = new Map(entries.map((entry) => [entry.slug, lazy(entry.load)]))
  return function AppRouter() {
    const segments = window.location.pathname.split('/').filter(Boolean)
    const slug = segments.length === 1 ? segments[0] : undefined
    const PresentationRoute = slug ? routes.get(slug) : undefined
    return PresentationRoute ? <Suspense fallback={<p data-presentation-loading="true">Loading presentation…</p>}>{createElement(PresentationRoute)}</Suspense> : <Landing />
  }
}

export const AppRouter = createAppRouter(presentations)
