import { Component, lazy, StrictMode, Suspense } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Landing from './Landing'
import { presentations } from './presentations/index'
const slug = window.location.pathname.split('/').filter(Boolean)[0]
const entry = presentations.find((item) => item.slug === slug)
const Routed = entry ? lazy(entry.load) : null
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <main role="alert">Presentation failed to load. <a href="/">Home</a></main> : this.props.children }
}
createRoot(document.getElementById('root')!).render(<StrictMode><Boundary><Suspense fallback={<main aria-busy="true">Loading…</main>}>{Routed ? <Routed /> : <Landing />}</Suspense></Boundary></StrictMode>)
