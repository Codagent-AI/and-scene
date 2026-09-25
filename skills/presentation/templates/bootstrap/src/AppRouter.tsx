import { createElement, lazy, Suspense } from 'react'
import Landing from './Landing'
import { presentations } from './presentations'

const routes = new Map(presentations.map((entry) => [entry.slug, lazy(entry.load)]))
export function AppRouter() {
  const slug = window.location.pathname.replace(/^\/+|\/+$/g, '')
  const route = slug ? routes.get(slug) ?? Landing : Landing
  return <Suspense fallback={<main aria-live="polite">Loading presentation…</main>}>{createElement(route)}</Suspense>
}
