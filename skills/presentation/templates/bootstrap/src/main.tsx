import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { presentations } from './presentations'
import { resolvePresentation } from './presentations/resolve'
const entry = resolvePresentation(presentations, location.pathname)
const Page = entry ? lazy(entry.load) : null
createRoot(document.getElementById('root')!).render(<StrictMode>{Page ? <Suspense fallback={<p>Loading…</p>}><Page /></Suspense> : <main><h1>Presentations</h1>{presentations.map(item => <p key={item.slug}><a href={`/${item.slug}`}>{item.title}</a></p>)}</main>}</StrictMode>)
