import { Component, createElement, lazy, Suspense, useEffect, useState, type ComponentType, type LazyExoticComponent } from 'react'
import Landing from './Landing'
import { getBasePath, resolveRoute } from './route-utils'
import type { PresentationEntry } from './presentations'

class PresentationErrorBoundary extends Component<{ children: React.ReactNode; homeHref: string }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) return <main role="alert"><h1>Presentation failed to load</h1><p>{this.state.error.message}</p><a href={this.props.homeHref}>Back to presentations</a></main>
    return this.props.children
  }
}

function RouteLoader({ entry, homeHref }: { entry: PresentationEntry; homeHref: string }) {
  const [Route] = useState<LazyExoticComponent<ComponentType>>(() => lazy(entry.load))
  return <PresentationErrorBoundary homeHref={homeHref}><Suspense fallback={<div role="status">Loading presentation…</div>}>{createElement(Route)}</Suspense></PresentationErrorBoundary>
}

export function Router({ entries, baseUrl = '/' }: { entries: readonly PresentationEntry[]; baseUrl?: string }) {
  const [pathname, setPathname] = useState(window.location.pathname)
  useEffect(() => {
    const update = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', update)
    return () => window.removeEventListener('popstate', update)
  }, [])
  const resolution = resolveRoute(pathname, entries, baseUrl)
  const homeHref = getBasePath(baseUrl)
  if (resolution.kind === 'not-found') return <main data-presentation-not-found><h1>Presentation not found</h1><p>No presentation is registered at “{resolution.slug}”.</p><a href={homeHref}>Back to presentations</a></main>
  if (resolution.kind === 'landing') return <Landing basePath={homeHref} />
  return <RouteLoader key={resolution.entry.slug} entry={resolution.entry} homeHref={homeHref} />
}
