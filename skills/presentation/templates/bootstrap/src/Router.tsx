import { createElement, Suspense, lazy } from 'react'
import { presentations } from './presentations'
import Landing from './Landing'
const routes = Object.fromEntries(presentations.map(entry => [entry.slug, lazy(entry.load)]))
export default function Router() {
  const slug = location.pathname.replace(/^\/+|\/+$/g, '')
  const Talk = routes[slug]
  if (!Talk) return <Landing />
  return <Suspense fallback={<p>Loading presentation…</p>}>{createElement(Talk)}</Suspense>
}
