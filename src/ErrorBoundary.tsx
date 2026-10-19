import { Component, type ReactNode } from 'react'

interface State {
  failed: boolean
}

/** Shows a visible message and a way back when a presentation fails to load or render. */
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main data-presentation-error="">
        <p>This presentation failed to load.</p>
        <p>
          <a href={window.location.pathname}>Reload</a> · <a href="/">All presentations</a>
        </p>
      </main>
    )
  }
}
