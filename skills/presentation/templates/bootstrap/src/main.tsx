import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Landing from './Landing'
import { presentations } from './presentations'
import { resolveRoute } from './routes'

const route = resolveRoute(window.location.pathname, presentations)
const Talk = route.kind === 'presentation' ? lazy(route.entry.load) : null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {Talk ? (
      <Suspense fallback={null}>
        <Talk />
      </Suspense>
    ) : (
      <Landing />
    )}
  </StrictMode>,
)
