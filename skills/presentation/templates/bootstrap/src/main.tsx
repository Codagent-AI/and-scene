import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { presentations } from './presentations'
import { Router } from './router'

createRoot(document.getElementById('root')!).render(<StrictMode><Router entries={presentations} /></StrictMode>)
