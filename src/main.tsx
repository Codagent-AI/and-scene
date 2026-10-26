import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { presentations } from './presentations'
import { resolvePresentation } from './routing'
import { Landing } from './Landing'
import './index.css'
const entry = resolvePresentation(window.location.pathname, presentations)
const Page = entry ? lazy(entry.load) : Landing
createRoot(document.getElementById('root')!).render(<StrictMode><Suspense fallback={<p>Loading presentation…</p>}><Page /></Suspense></StrictMode>)
