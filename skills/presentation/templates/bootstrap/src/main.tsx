import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { presentations } from './presentations'
import { Landing } from './Landing'
import './index.css'
const entry = presentations.find(p => `/${p.slug}` === window.location.pathname)
const Talk = entry ? lazy(entry.load) : undefined
createRoot(document.getElementById('root')!).render(<StrictMode>{Talk ? <Suspense fallback={<p>Loading…</p>}><Talk /></Suspense> : <Landing />}</StrictMode>)
