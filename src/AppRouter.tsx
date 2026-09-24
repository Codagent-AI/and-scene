import { createElement, lazy, Suspense } from 'react'
import Landing from './Landing.tsx'
import { presentations } from './presentations/index.ts'
import { resolvePresentation } from './presentations/registry.ts'

const routes = new Map(presentations.map((entry) => [entry.slug, lazy(entry.load)]))

export function AppRouter() {
  const presentation = resolvePresentation(window.location.pathname, presentations)
  const route = presentation ? routes.get(presentation.slug) ?? Landing : Landing
  return <Suspense fallback={<main aria-live="polite">Loading presentation…</main>}>{createElement(route)}</Suspense>
}
