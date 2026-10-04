import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import Landing from './Landing'
import { presentations } from './presentations'
import './index.css'
const routes = new Map(presentations.map((entry) => [entry.slug, lazy(entry.load)]))
const slug = window.location.pathname.replace(/^\/+|\/+$/g, '')
const Route = routes.get(slug)
createRoot(document.getElementById('root')!).render(<StrictMode>{Route ? <Suspense fallback={<main>Loading presentation…</main>}><Route /></Suspense> : <Landing />}</StrictMode>)
