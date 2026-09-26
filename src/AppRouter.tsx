import { createElement, lazy, Suspense } from 'react'
import Landing from './Landing'
import { presentations } from './presentations'

const routes = new Map(presentations.map(({ slug, load }) => [slug, lazy(load)]))

export default function AppRouter() {
  const slug = window.location.pathname.replace(/^\/+|\/+$/g, '')
  const Route = routes.get(slug) ?? Landing
  return <Suspense fallback={<p>Loading presentation…</p>}>{createElement(Route)}</Suspense>
}
