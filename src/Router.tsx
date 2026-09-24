import { createElement, lazy, Suspense } from 'react'
import Landing from './Landing'
import { presentations } from './presentations'

const routeComponents = new Map(presentations.map((route) => [route.slug, lazy(route.load)]))

export default function Router() {
  const slug = window.location.pathname.replace(/^\/+|\/+$/g, '')
  const Page = routeComponents.get(slug)
  return Page ? <Suspense fallback={<p>Loading presentation…</p>}>{createElement(Page)}</Suspense> : <Landing />
}
