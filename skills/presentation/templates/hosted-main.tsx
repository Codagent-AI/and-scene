import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Router from './Router'
import { resolveRoute } from './route'

// Presentation routes are served by the presentation router; every other path
// keeps running the application that already owned this entry point.
if (resolveRoute(window.location.pathname)) {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Router pathname={window.location.pathname} />
    </StrictMode>,
  )
} else {
  void import('./app-main')
}
