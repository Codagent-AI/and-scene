import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import Landing from './Landing'
import { presentations } from './presentations'
import './index.css'
import './presentation-kit/presentation.css'

const entry = presentations.find((item) => `/${item.slug}` === window.location.pathname.replace(/\/$/, ''))
const Talk = entry ? lazy(entry.load) : null
createRoot(document.getElementById('root')!).render(<StrictMode>{Talk ? <Suspense fallback={<p>Loading presentation…</p>}><Talk /></Suspense> : <Landing />}</StrictMode>)
