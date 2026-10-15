import { StrictMode, Suspense, lazy } from 'react'
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
      <Suspense fallback={null}>
        <Page />
      </Suspense>
    </StrictMode>,
  )
}

mount()
