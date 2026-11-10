import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import Landing from './Landing'
import { resolvePresentation } from './presentations'
import './index.css'
const entry = resolvePresentation(window.location.pathname)
const Page = entry ? lazy(entry.load) : Landing
createRoot(document.getElementById('root')!).render(<StrictMode><Suspense fallback={<p>Loading presentation…</p>}><Page /></Suspense></StrictMode>)
