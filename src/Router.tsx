import { createElement, lazy, Suspense } from 'react'
import Landing from './Landing'
import { presentations } from './presentations'
import { resolvePresentation } from './presentations/resolvePresentation'

const routes = new Map(presentations.map((entry) => [entry.slug, lazy(entry.load)]))

export default function Router() {
  const presentation = resolvePresentation(window.location.pathname, presentations)
  const route = (presentation && routes.get(presentation.slug)) ?? Landing
  return <Suspense fallback={<main aria-busy="true" data-presentation-loading="">Loading presentation…</main>}>{createElement(route)}</Suspense>
}
