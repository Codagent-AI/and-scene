import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Landing } from './Landing.tsx'
import { PRESENTATIONS } from './presentations/index.ts'
import { resolveRoute } from './router.ts'

const route = resolveRoute(window.location.pathname, PRESENTATIONS)
const Talk = route.kind === 'presentation' ? lazy(route.entry.load) : null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {Talk ? (
      <Suspense fallback={null}>
        <Talk />
      </Suspense>
    ) : (
      <Landing registry={PRESENTATIONS} />
    )}
  </StrictMode>,
)
