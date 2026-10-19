import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { presentations } from './presentations'
import { Root } from './Root'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root pathname={window.location.pathname} registry={presentations} />
  </StrictMode>,
)
