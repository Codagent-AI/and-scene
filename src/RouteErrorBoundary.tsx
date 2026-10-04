import { Component, type ErrorInfo, type ReactNode } from 'react'
type Props = { children: ReactNode }
type State = { failed: boolean }
export default class RouteErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Presentation route failed to load', error, info) }
  render() {
    if (this.state.failed) return <main role="alert" data-route-error=""><h1>Presentation unavailable</h1><p>This presentation could not be loaded.</p><a href="/">Return to presentations</a></main>
    return this.props.children
  }
}
