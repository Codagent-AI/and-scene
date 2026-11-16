import { Component, lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import { presentations } from './presentations'
import { Landing } from './Landing'
class PresentationBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (this.state.failed) return <main role="alert"><h1>Unable to load this presentation</h1><p>Reload the page to try again, or return to the presentation list.</p><a href="/">Back to presentations</a></main>
    return this.props.children
  }
}
const routes = presentations.map(entry => ({ ...entry, Component: lazy(entry.load) }))
export function Router({ pathname = window.location.pathname }: { pathname?: string }) {
  const route = routes.find(entry => `/${entry.slug}` === pathname.replace(/\/$/, ''))
  if (!route) return <Landing />
  return <PresentationBoundary key={route.slug}><Suspense fallback={<p role="status">Loading presentation…</p>}><route.Component /></Suspense></PresentationBoundary>
}
