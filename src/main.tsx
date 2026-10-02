import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Landing from './Landing'
import { presentations } from './presentations'

const slug = window.location.pathname.split('/').filter(Boolean)[0]
const entry = presentations.find((presentation) => presentation.slug === slug)
const RoutedPresentation = entry ? lazy(entry.load) : null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<main className="presentation-loading" aria-live="polite">Loading presentation…</main>}>
      {RoutedPresentation ? <RoutedPresentation /> : <Landing />}
    </Suspense>
  </StrictMode>,
)
