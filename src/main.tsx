import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './presentations/how-to-make-a-presentation/talk.css'
import { RouteView } from './RouteView'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouteView pathname={window.location.pathname} />
  </StrictMode>,
)
