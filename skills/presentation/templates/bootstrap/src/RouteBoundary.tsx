import { Component, type ReactNode } from 'react'
import Landing from './Landing.tsx'

/** Falls back to the landing page, with a visible alert so render errors are never silent. */
export class RouteBoundary extends Component<{ children: ReactNode }, { error: unknown }> {
  state = { error: null as unknown }
  static getDerivedStateFromError(error: unknown) {
    return { error }
  }
  componentDidCatch(error: unknown) {
    console.error('presentation failed to render', error)
  }
  render() {
    if (!this.state.error) return this.props.children
    const message = this.state.error instanceof Error ? this.state.error.message : String(this.state.error)
    return (
      <>
        <p role="alert" data-route-error="">
          This presentation failed to load: {message}
        </p>
        <Landing />
      </>
    )
  }
}
