import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Landing from './Landing'
import { resolvePresentation } from './presentations'
const entry = resolvePresentation(window.location.pathname)
const Page = entry ? lazy(entry.load) : Landing
createRoot(document.getElementById('root')!).render(<StrictMode><Suspense fallback={<p role="status">Loading presentation…</p>}><Page /></Suspense></StrictMode>)
