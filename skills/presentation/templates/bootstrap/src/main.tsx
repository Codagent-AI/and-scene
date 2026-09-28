import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Router } from './router.tsx'
import { presentations } from './presentations'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router registry={presentations} />
  </StrictMode>,
)
