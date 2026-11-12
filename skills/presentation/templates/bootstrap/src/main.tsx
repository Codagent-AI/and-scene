import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import Landing from './Landing'
import { presentations } from './presentations'
const entry = presentations.find(p => `/${p.slug}` === window.location.pathname)
const Page = entry ? lazy(entry.load) : Landing
createRoot(document.getElementById('root')!).render(<StrictMode><Suspense fallback={<p>Loading…</p>}><Page /></Suspense></StrictMode>)
