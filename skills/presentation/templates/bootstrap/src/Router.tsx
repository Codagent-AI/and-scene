import { createElement, lazy, Suspense } from 'react'
import Landing from './Landing'
import { presentations } from './presentations'

const routes = new Map(presentations.map((item) => [item.slug, lazy(item.load)]))

export default function Router() {
  const slug = window.location.pathname.replace(/^\/+|\/+$/g, '')
  const Page = routes.get(slug)
  return Page ? <Suspense fallback={<p>Loading presentation…</p>}>{createElement(Page)}</Suspense> : <Landing />
}
