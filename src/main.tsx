import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { presentations } from './presentations'
import { resolvePresentationRoute } from './resolve-route'
import './index.css'

const registration = resolvePresentationRoute(window.location.pathname, presentations)
const Route = registration ? lazy(registration.load) : undefined
const Landing = lazy(() => import('./Landing'))

function App() {
  return <StrictMode>
    <Suspense fallback={<div role="status">Loading presentation…</div>}>
      {Route ? <Route /> : <Landing />}
    </Suspense>
  </StrictMode>
}

createRoot(document.getElementById('root')!).render(<App />)

export default App
