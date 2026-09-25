import { lazy, Suspense, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Landing from './Landing.tsx'
import { resolvePresentationRoute } from './presentations'

const route = resolvePresentationRoute(window.location.pathname)
const RoutedPresentation = route ? lazy(route.load) : null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<main data-presentation-loading="">Loading presentation…</main>}>
      {RoutedPresentation ? <RoutedPresentation /> : <Landing />}
    </Suspense>
  </StrictMode>,
)
