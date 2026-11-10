import { Component, lazy, Suspense, type ReactNode } from 'react'
import Landing from './Landing'
import { presentations } from './presentations'
const routes = presentations.map(entry => ({ ...entry, Component: lazy(entry.load) }))
class RouteBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    return this.state.failed ? <main role="alert"><p>Unable to load this presentation. Reload this page to try again.</p><a href="/">Back to presentations</a></main> : this.props.children
  }
}
export function Router({ pathname = window.location.pathname }: { pathname?: string }) {
  const route = routes.find(entry => `/${entry.slug}` === pathname.replace(/\/$/, ''))
  return route ? <RouteBoundary key={route.slug}><Suspense fallback={<p role="status">Loading presentation…</p>}><route.Component /></Suspense></RouteBoundary> : <Landing />
}
