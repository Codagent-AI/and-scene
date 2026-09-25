import { lazy, Suspense } from 'react'
import { Landing } from './Landing'
import { presentations } from './presentations'

export default function Router() {
  const slug = window.location.pathname.split('/').filter(Boolean)[0]
  const entry = presentations.find((item) => item.slug === slug)
  if (!entry) return <Landing />
  const Talk = lazy(entry.load)
  return <Suspense fallback={<div>Loading presentation…</div>}><Talk /></Suspense>
}
