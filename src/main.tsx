import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AppRoot } from './AppRoot'
import { presentations } from './presentations'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRoot pathname={window.location.pathname} entries={presentations} />
  </StrictMode>,
)
