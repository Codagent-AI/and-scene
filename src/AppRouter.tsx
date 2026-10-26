import { Component, Suspense, use, useState } from 'react'
import type { ReactNode } from 'react'
import { Landing } from './Landing'
import type { PresentationEntry } from './presentations'
import { presentationRegistry } from './presentations'
import { loadPresentationModule, resetPresentationModule } from './presentationLoader'
import { resolvePresentationRoute } from './router'

function RegisteredPresentation({ entry }: { entry: PresentationEntry }) {
  const PresentationPage = use(loadPresentationModule(entry)).default
  return <PresentationPage />
}

type PresentationLoadBoundaryProps = { children: ReactNode; onRetry: () => void }

export class PresentationLoadBoundary extends Component<PresentationLoadBoundaryProps, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  private retry = () => {
    this.setState({ failed: false })
    this.props.onRetry()
  }

  render() {
    if (this.state.failed) {
      return <section role="alert"><p>Unable to load this presentation.</p><button onClick={this.retry} type="button">Retry loading presentation</button></section>
    }
    return this.props.children
  }
}

export function PresentationRoute({ entry }: { entry: PresentationEntry }) {
  const [attempt, setAttempt] = useState(0)
  const retry = () => {
    resetPresentationModule(entry)
    setAttempt((current) => current + 1)
  }

  return (
    <PresentationLoadBoundary onRetry={retry}>
      <Suspense fallback={<p>Loading presentation…</p>}><RegisteredPresentation entry={entry} key={attempt} /></Suspense>
    </PresentationLoadBoundary>
  )
}


export function AppRouter() {
  const route = resolvePresentationRoute(window.location.pathname, presentationRegistry)
  if (route.kind === 'landing') return <Landing />

  return <PresentationRoute entry={route.entry} />
}
