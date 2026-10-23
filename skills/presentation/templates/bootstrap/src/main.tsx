import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { PRESENTATIONS } from './presentations'
import { lazyPresentations } from './registry'
import { Router } from './Router'

const components = lazyPresentations(PRESENTATIONS)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router pathname={window.location.pathname} registry={PRESENTATIONS} components={components} />
  </StrictMode>,
)
