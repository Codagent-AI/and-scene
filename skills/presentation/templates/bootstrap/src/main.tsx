import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Landing, NotFound } from './Landing.tsx'
import { presentations } from './presentations/index.ts'
import { resolveRoute } from './router.ts'

const route = resolveRoute(window.location.pathname, presentations)
const Talk = route.kind === 'presentation' ? lazy(route.entry.load) : null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {route.kind === 'landing' && <Landing />}
    {route.kind === 'not-found' && <NotFound path={route.path} />}
    {Talk && (
      <Suspense fallback={null}>
        <Talk />
      </Suspense>
    )}
  </StrictMode>,
)
