import { createElement, lazy, Suspense } from 'react'
import { presentations } from './presentations'
import Landing from './Landing'
import { resolvePresentationSlug } from './route'

const registry = new Map(presentations.map((presentation) => [presentation.slug, lazy(presentation.load)]))

export default function AppRouter() {
  const slug = resolvePresentationSlug(window.location.pathname, import.meta.env.BASE_URL)
  const route = slug ? registry.get(slug) : undefined
  if (!route) return <Landing />
  return <Suspense fallback={<main data-route-loading="">Loading presentation…</main>}>{createElement(route)}</Suspense>
}
