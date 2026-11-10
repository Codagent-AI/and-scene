import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Router } from './host/Router'
createRoot(document.getElementById('root')!).render(<StrictMode><Router /></StrictMode>)
