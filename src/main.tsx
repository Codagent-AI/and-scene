import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Router } from './Router.tsx'
import { PRESENTATIONS } from './presentations/index.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router pathname={window.location.pathname} registry={PRESENTATIONS} />
  </StrictMode>,
)
