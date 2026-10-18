import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { PRESENTATIONS } from './presentations'
import { createRouter } from './Router'

const Router = createRouter(PRESENTATIONS)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router pathname={window.location.pathname} />
  </StrictMode>,
)
