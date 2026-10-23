import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Router } from './Router'
import { PRESENTATIONS } from './presentations'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router entries={PRESENTATIONS} pathname={window.location.pathname} />
  </StrictMode>,
)
