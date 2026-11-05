import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import Landing from './Landing'
import { presentations } from './presentations'
import './index.css'
const slug = window.location.pathname.replace(/^\/+|\/+$/g, '')
const found = presentations.find(p => p.slug === slug)
// Lazy routes split presentation bundles.
// eslint-disable-next-line react-refresh/only-export-components
const Page = found ? lazy(found.load) : Landing
createRoot(document.getElementById('root')!).render(<StrictMode><Suspense fallback={<p>Loading…</p>}><Page /></Suspense></StrictMode>)
