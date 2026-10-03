import { Suspense, lazy } from 'react'
import { presentations } from './presentations'
import { resolvePresentation } from './presentation-kit/routing'
import Landing from './Landing'

const entry = resolvePresentation(window.location.pathname, presentations)
const Routed = entry ? lazy(entry.load) : Landing

export default function Router() {
  return <Suspense fallback={<main aria-busy="true">Loading presentation…</main>}><Routed /></Suspense>
}
