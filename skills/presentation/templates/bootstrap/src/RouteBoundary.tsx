import { Component, type ReactNode } from 'react'
import Landing from './Landing.tsx'

/** Logs a failed presentation load (e.g. chunk fetch) and falls back to the landing page. */
export class RouteBoundary extends Component<{ children: ReactNode }, { error: unknown }> {
  state = { error: null as unknown }
  static getDerivedStateFromError(error: unknown) {
    return { error }
  }
  componentDidCatch(error: unknown) {
    console.error('presentation failed to load', error)
  }
  render() {
    return this.state.error ? <Landing /> : this.props.children
  }
}
