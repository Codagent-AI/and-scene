import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import Landing from './Landing'
import { presentations } from './presentations'
import { findPresentation } from './routing'
import './index.css'

const entry = findPresentation(window.location.pathname, presentations)
const Talk = entry && lazy(entry.load)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<p role="status">Loading presentation…</p>}>
      {Talk ? <Talk /> : <Landing presentations={presentations} />}
    </Suspense>
  </StrictMode>,
)
