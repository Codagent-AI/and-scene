import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import Landing from './Landing'
import { presentations } from './presentations'
const slug = window.location.pathname.replace(/^\/+|\/+$/g, '')
const entry = presentations.find(item => item.slug === slug)
const Page = entry ? lazy(entry.load) : Landing
createRoot(document.getElementById('root')!).render(<StrictMode><Suspense fallback={<p>Loading presentation…</p>}><Page /></Suspense></StrictMode>)
