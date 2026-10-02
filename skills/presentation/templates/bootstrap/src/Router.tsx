import { Suspense, createElement, lazy } from 'react'
import Landing from './Landing'
import { presentations } from './presentations'
import { safeDecodePathSegment } from './routeUtils'

const routes = new Map(presentations.map(({ slug, load }) => [slug, lazy(load)]))

export default function Router() {
  const slug = safeDecodePathSegment(window.location.pathname.split('/').filter(Boolean)[0] ?? '')
  const route = routes.get(slug) ?? Landing
  return <Suspense fallback={<main data-presentation-loading>Loading…</main>}>{createElement(route)}</Suspense>
}
