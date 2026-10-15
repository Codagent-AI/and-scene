import { StrictMode, Suspense, lazy } from 'react'
import { RouteBoundary } from './RouteBoundary.tsx'
import { createRoot } from 'react-dom/client'
import './index.css'
import Landing from './Landing.tsx'
import { presentations } from './presentations'
import { resolveRoute } from './routes.ts'

function mount() {
  const route = resolveRoute(window.location.pathname, presentations)
  const Page = route.kind === 'presentation' ? lazy(route.entry.load) : Landing
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <RouteBoundary>
        <Suspense fallback={null}>
          <Page />
        </Suspense>
      </RouteBoundary>
    </StrictMode>,
  )
}

mount()
