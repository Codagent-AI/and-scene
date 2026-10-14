import { Component } from 'react'
import type { ReactNode } from 'react'

export class PresentationErrorBoundary extends Component<{
  children: ReactNode
  title: string
}, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children

    return <main className="landing presentation-error" role="alert">
      <div className="landing-heading">
        <p className="landing-eyebrow">{this.props.title}</p>
        <h1>Unable to open this presentation</h1>
        <p>Try reloading the page, or return to the presentation list.</p>
        <a href="/">Back to presentations</a>
      </div>
    </main>
  }
}
