import { createElement, Suspense, lazy, useEffect, useState } from 'react'
import Landing from './Landing'
import RouteErrorBoundary from './RouteErrorBoundary'
import { presentations } from './presentations'

const routes = new Map(presentations.map(entry => [entry.slug, lazy(entry.load)]))
export default function Router() {
  const [pathname, setPathname] = useState(window.location.pathname)
  useEffect(() => {
    const update = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', update)
    return () => window.removeEventListener('popstate', update)
  }, [])
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  const presentation = routes.get(slug)
  return <RouteErrorBoundary key={slug}><Suspense fallback={<main data-route-loading="">Loading presentation…</main>}>{presentation ? createElement(presentation) : <Landing />}</Suspense></RouteErrorBoundary>
}
