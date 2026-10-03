import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import Landing from './Landing'
import { presentations } from './presentations'
import { normalizeRoute } from './route'
import './index.css'

const route = normalizeRoute(window.location.pathname)
const match = presentations.find((presentation) => presentation.slug === route)
const PresentationPage = match ? lazy(match.load) : null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<p role="status">Loading presentation…</p>}>
      {PresentationPage ? <PresentationPage /> : <Landing />}
    </Suspense>
  </StrictMode>,
)
