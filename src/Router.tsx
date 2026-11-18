import { lazy, Suspense } from 'react'
import Landing from './Landing'
import { findPresentation } from './presentations'
const entry = findPresentation(window.location.pathname)
const ActivePresentation = entry ? lazy(entry.load) : null
export default function Router() {
  return ActivePresentation ? <Suspense fallback={<p role="status">Loading presentation…</p>}><ActivePresentation /></Suspense> : <Landing />
}
