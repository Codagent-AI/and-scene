import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import Landing from './Landing'
import { RouteErrorBoundary } from './RouteErrorBoundary'
import { resolvePresentation } from './presentations'
import './index.css'

const entry = resolvePresentation(window.location.pathname)
const Route = entry ? lazy(entry.load) : Landing

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouteErrorBoundary><Suspense fallback={<main>Loading presentation…</main>}><Route /></Suspense></RouteErrorBoundary>
  </StrictMode>,
)
