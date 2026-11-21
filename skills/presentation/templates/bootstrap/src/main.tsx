import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Router from './Router'
import { presentations } from './presentations'
import { createRoutes } from './routes'
import './index.css'

const routes = createRoutes(presentations)
createRoot(document.getElementById('root')!).render(
  <StrictMode><Router pathname={window.location.pathname} routes={routes} /></StrictMode>,
)
