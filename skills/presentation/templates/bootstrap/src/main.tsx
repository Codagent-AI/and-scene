import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Landing } from './Landing'
import { presentations } from './presentations'
import { resolveRoute } from './router'

const route = resolveRoute(window.location.pathname, presentations)
const Presentation = route.kind === 'presentation' ? lazy(route.entry.load) : null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {Presentation ? (
      <Suspense fallback={null}>
        <Presentation />
      </Suspense>
    ) : (
      <Landing registry={presentations} />
    )}
  </StrictMode>,
)
