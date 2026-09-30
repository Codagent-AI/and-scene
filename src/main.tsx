import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { PathnameRouter } from './PathnameRouter.tsx'
import { presentations } from './presentations/index.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PathnameRouter pathname={window.location.pathname} presentations={presentations} />
  </StrictMode>,
)
