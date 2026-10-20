import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { PRESENTATIONS } from './presentations/index.ts'
import { Router } from './Router.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router registry={PRESENTATIONS} pathname={window.location.pathname} />
  </StrictMode>,
)
