import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { lazy, Suspense } from 'react'
import Landing from './Landing'
import { presentations } from './presentations'

const slug = window.location.pathname.replace(/^\/+|\/+$/g, '')
const route = presentations.find(presentation => presentation.slug === slug)
const RoutedPresentation = route ? lazy(route.load) : null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<div data-presentation-loading="">Loading presentation…</div>}>
      {RoutedPresentation ? <RoutedPresentation /> : <Landing />}
    </Suspense>
  </StrictMode>,
)
