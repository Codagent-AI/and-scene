import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Landing from './Landing'
import { presentations } from './presentations'

const slug = window.location.pathname.split('/').filter(Boolean)[0]
const presentation = presentations.find((item) => item.slug === slug)
const RoutedPresentation = presentation ? lazy(presentation.load) : null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<p>Loading presentation…</p>}>
      {RoutedPresentation ? <RoutedPresentation /> : <Landing />}
    </Suspense>
  </StrictMode>,
)
