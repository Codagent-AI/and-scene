import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { failed: boolean }

export class PageErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Presentation page failed to render', error, info.componentStack)
  }

  render() {
    if (this.state.failed) {
      return <main role="alert" data-presentation-load-error style={{ maxWidth: 720, margin: '12vh auto', padding: 24 }}>
        <h1>This presentation could not be loaded.</h1>
        <p>Reload the page to try again.</p>
        <a href={window.location.href}>Reload presentation</a>
      </main>
    }
    return this.props.children
  }
}
