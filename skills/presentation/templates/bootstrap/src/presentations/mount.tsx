import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import Landing from '../Landing'
import { resolveRoute } from '../route'
import { PRESENTATIONS } from '.'

/**
 * Render the presentation for the current path into `#root`. Returns false (and renders
 * nothing) for unregistered paths unless `landing` is set, so an existing app can keep its own routes.
 */
export function mountPresentations({ landing = false }: { landing?: boolean } = {}): boolean {
  const entry = resolveRoute(window.location.pathname, PRESENTATIONS)
  if (!entry && !landing) return false
  const Page = entry ? lazy(entry.load) : null
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      {Page ? (
        <Suspense fallback={null}>
          <Page />
        </Suspense>
      ) : (
        <Landing registry={PRESENTATIONS} />
      )}
    </StrictMode>,
  )
  return true
}
