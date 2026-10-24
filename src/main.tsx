import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AppRouter } from './AppRouter.tsx'
import { presentations } from './presentations/index.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRouter pathname={window.location.pathname} registry={presentations} />
  </StrictMode>,
)
