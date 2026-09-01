import { createElement, lazy, Suspense } from 'react'
import Landing from './Landing'
import { presentations, type PresentationRegistration } from './presentations'

export function createAppRouter(entries: readonly PresentationRegistration[]) {
  const routes = new Map(entries.map((entry) => [entry.slug, lazy(entry.load)]))

  return function AppRouter() {
    const slug = window.location.pathname.split('/').filter(Boolean)[0]
    const PresentationRoute = slug ? routes.get(slug) : undefined

    if (!PresentationRoute) return <Landing />

    return (
      <Suspense fallback={<p data-presentation-loading="true">Loading presentation…</p>}>
        {createElement(PresentationRoute)}
      </Suspense>
    )
  }
}

export const AppRouter = createAppRouter(presentations)
