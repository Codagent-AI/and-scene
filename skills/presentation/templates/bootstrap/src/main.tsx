import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Landing from './Landing'
import { PRESENTATIONS } from './presentations'
import { resolveRoute } from './route'

// Resolved once at module load: the route is fixed for the lifetime of the page.
const entry = resolveRoute(window.location.pathname, PRESENTATIONS)
const Page = entry ? lazy(entry.load) : null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {Page ? (
      <Suspense fallback={null}>
        <Page />
      </Suspense>
    ) : (
      <Landing registry={PRESENTATIONS} />
    )}
  </StrictMode>,
)
