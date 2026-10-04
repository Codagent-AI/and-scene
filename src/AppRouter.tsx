import { createElement, lazy, Suspense } from 'react'
import { presentations } from './presentations'
import Landing from './Landing'

const registry = new Map(presentations.map((presentation) => [presentation.slug, lazy(presentation.load)]))

export default function AppRouter() {
  const slug = window.location.pathname.split('/').filter(Boolean).join('/')
  const route = slug ? registry.get(slug) : undefined
  if (!route) return <Landing />
  return <Suspense fallback={<main data-route-loading="">Loading presentation…</main>}>{createElement(route)}</Suspense>
}
