import { Component, lazy, StrictMode, Suspense } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Landing from './Landing.tsx'
import { presentations } from './presentations/index.ts'

const slug = window.location.pathname.split('/').filter(Boolean)[0]
const entry = presentations.find((presentation) => presentation.slug === slug)
const RoutedPresentation = entry ? lazy(entry.load) : null

class RouteErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (this.state.failed) return <main role="alert"><p>This presentation could not be loaded.</p><a href="/">Back to presentations</a></main>
    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouteErrorBoundary>
      <Suspense fallback={<main aria-busy="true">Loading presentation…</main>}>
        {RoutedPresentation ? <RoutedPresentation /> : <Landing />}
      </Suspense>
    </RouteErrorBoundary>
  </StrictMode>,
)
