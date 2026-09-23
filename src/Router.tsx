import { Suspense, createElement, lazy } from 'react'
import { presentations } from './presentations'
import { resolvePresentation } from './presentation-kit/routing'
import Landing from './Landing'

export default function Router() {
  const entry = resolvePresentation(window.location.pathname, presentations)
  const Routed = entry ? lazy(entry.load) : Landing
  return <Suspense fallback={<main aria-busy="true">Loading presentation…</main>}>{createElement(Routed)}</Suspense>
}
