import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Landing from './Landing.tsx'
import { presentations } from './presentations'
import { resolveRoute } from './route.ts'

const route = resolveRoute(window.location.pathname, presentations)
const Talk = route.kind === 'presentation' ? lazy(route.entry.load) : null

function Root() {
  if (!Talk) return <Landing presentations={presentations} />
  return (
    <Suspense fallback={null}>
      <Talk />
    </Suspense>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
