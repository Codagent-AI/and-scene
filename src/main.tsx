import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Landing from './Landing'
import { presentations } from './presentations'
const slug = window.location.pathname.split('/').filter(Boolean)[0]
const entry = slug ? presentations.find(item => item.slug === slug) : undefined
const PresentationPage = entry ? lazy(entry.load) : null
createRoot(document.getElementById('root')!).render(<StrictMode>{PresentationPage ? <Suspense fallback={<p>Loading presentation…</p>}><PresentationPage /></Suspense> : <Landing />}</StrictMode>)
