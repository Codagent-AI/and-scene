import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { resolveRoute } from './route'

createRoot(document.getElementById('root')!).render(
  <StrictMode>{resolveRoute(window.location.pathname)}</StrictMode>,
)
