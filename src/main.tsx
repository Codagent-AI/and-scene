import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Landing from './Landing.tsx'
import { presentations } from './presentations/index.ts'
import { resolveRoute } from './router.ts'

const route = resolveRoute(window.location.pathname, presentations)
const Page = route.kind === 'presentation' ? lazy(route.entry.load) : null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {Page ? (
      <Suspense fallback={null}>
        <Page />
      </Suspense>
    ) : (
      <Landing registry={presentations} />
    )}
  </StrictMode>,
)
