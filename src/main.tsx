import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Landing from './Landing.tsx'
import { findPresentation, slugFromPath } from './presentations'

// Pathname routing: each page load resolves exactly one route.
const entry = findPresentation(slugFromPath(window.location.pathname))
const Talk = entry ? lazy(entry.load) : null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {Talk ? (
      <Suspense fallback={null}>
        <Talk />
      </Suspense>
    ) : (
      <Landing />
    )}
  </StrictMode>,
)
