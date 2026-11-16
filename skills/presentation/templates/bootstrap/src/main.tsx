import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { presentations } from './presentations'
const entry = presentations.find(p => `/${p.slug}` === window.location.pathname)
const Talk = entry ? lazy(entry.load) : null
createRoot(document.getElementById('root')!).render(<StrictMode>{Talk ? <Suspense fallback={<p role="status">Loading…</p>}><Talk /></Suspense> : <main><h1>Presentations</h1>{presentations.map(p => <p key={p.slug}><a href={`/${p.slug}`}>{p.title}</a></p>)}</main>}</StrictMode>)
