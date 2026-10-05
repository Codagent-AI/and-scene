import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Landing from './Landing'
import { presentations } from './presentations'
import { resolvePresentationRoute } from './router'

const route = resolvePresentationRoute(window.location.pathname, presentations)
const RoutedPresentation = route ? lazy(route.load) : null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<div data-presentation-loading="">Loading presentation…</div>}>
      {RoutedPresentation ? <RoutedPresentation /> : <Landing />}
    </Suspense>
  </StrictMode>,
)
