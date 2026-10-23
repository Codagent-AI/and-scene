import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { PRESENTATIONS } from './presentations/index.ts'
import { Router } from './router.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router pathname={window.location.pathname} registry={PRESENTATIONS} />
  </StrictMode>,
)
