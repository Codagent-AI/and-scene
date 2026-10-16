import { Suspense, lazy } from 'react'
import Landing from './Landing.tsx'
import { PRESENTATIONS } from './presentations/index.ts'
import { resolvePresentation } from './routes.ts'

const entry = resolvePresentation(window.location.pathname, PRESENTATIONS)
const Page = entry ? lazy(entry.load) : Landing

/** Minimal pathname router: "/" and unknown paths show the landing page, "/<slug>" the presentation. */
export default function App() {
  return (
    <Suspense fallback={null}>
      <Page />
    </Suspense>
  )
}
