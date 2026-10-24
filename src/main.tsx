import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Landing from './Landing'
import { presentations } from './presentations'
import { resolveRoute } from './routing'

const route = resolveRoute(window.location.pathname, presentations)
const Page = route.kind === 'presentation' ? lazy(route.entry.load) : null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {Page ? (
      <Suspense fallback={null}>
        <Page />
      </Suspense>
    ) : (
      <Landing presentations={presentations} />
    )}
  </StrictMode>,
)
