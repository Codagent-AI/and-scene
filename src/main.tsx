import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Landing from './Landing.tsx'
import { presentations } from './presentations/index.ts'

const slug = window.location.pathname.replace(/^\/+|\/+$/g, '')
const presentation = presentations.find((entry) => entry.slug === slug)
const RoutedPresentation = presentation ? lazy(presentation.load) : null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<div aria-live="polite" data-presentation-loading>Loading presentation…</div>}>
      {RoutedPresentation ? <RoutedPresentation /> : <Landing />}
    </Suspense>
  </StrictMode>,
)
