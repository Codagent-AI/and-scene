import { lazy, Suspense, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Landing from './Landing'
import { presentations } from './presentations'

const slug = window.location.pathname.replace(/^\/+|\/+$/g, '')
const entry = presentations.find(item => item.slug === slug)
const Route = entry ? lazy(entry.load) : null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<div role="status">Loading presentation…</div>}>
      {Route ? <Route /> : <Landing />}
    </Suspense>
  </StrictMode>,
)
