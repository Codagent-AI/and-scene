import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { findPresentation } from './presentations'
import Landing from './Landing'
import './index.css'
const entry = findPresentation(window.location.pathname)
const Page = entry ? lazy(entry.load) : Landing
createRoot(document.getElementById('root')!).render(<StrictMode><Suspense fallback={<p role="status">Loading presentation…</p>}><Page /></Suspense></StrictMode>)
