import { Component, type ReactNode } from 'react'

interface RouteErrorBoundaryProps { children: ReactNode }
interface RouteErrorBoundaryState { failed: boolean }

export class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return <main role="alert">
        <h1>Couldn’t load this presentation</h1>
        <p>Return to the presentation list and try again.</p>
        <a href="/">Back to all presentations</a>
      </main>
    }
    return this.props.children
  }
}
