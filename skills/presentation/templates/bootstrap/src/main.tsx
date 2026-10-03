import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Landing from './Landing.tsx'
import { presentations } from './presentations/index.ts'

const slug = window.location.pathname.split('/').filter(Boolean)[0]
const route = presentations.find(item => item.slug === slug)
const Page = route ? lazy(route.load) : null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<main aria-live="polite">Loading presentation…</main>}>
      {Page ? <Page /> : <Landing />}
    </Suspense>
  </StrictMode>,
)
