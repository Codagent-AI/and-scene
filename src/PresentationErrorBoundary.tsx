import { Component, type ReactNode } from 'react'
export class PresentationErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (this.state.failed) return <main role="alert" data-presentation-error="">
      <h1>This presentation could not be loaded.</h1>
      <p>Return to the index and try opening it again.</p>
      <a href="/">Back to presentations</a>
    </main>
    return this.props.children
  }
}
