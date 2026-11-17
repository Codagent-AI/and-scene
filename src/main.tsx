import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { findPresentation } from './presentations'
import { Landing } from './Landing'
import { PresentationErrorBoundary } from './PresentationErrorBoundary'
import './index.css'
const entry = findPresentation(window.location.pathname)
const Page = entry ? lazy(entry.load) : Landing
createRoot(document.getElementById('root')!).render(<StrictMode><PresentationErrorBoundary><Suspense fallback={<p>Loading presentation…</p>}><Page /></Suspense></PresentationErrorBoundary></StrictMode>)
