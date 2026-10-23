import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { PRESENTATIONS } from './presentations'
import { Router } from './Router'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router pathname={window.location.pathname} registry={PRESENTATIONS} />
  </StrictMode>,
)
