import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { presentations } from './presentations'
import './index.css'
const slug = window.location.pathname.split('/').filter(Boolean)[0]
const entry = presentations.find(p => p.slug === slug)
const Talk = entry ? lazy(entry.load) : null
createRoot(document.getElementById('root')!).render(<StrictMode>{Talk ? <Suspense fallback={<p>Loading…</p>}><Talk /></Suspense> : <main className="landing"><p>AND SCENE / PRESENTATIONS</p><h1>Ideas in motion.</h1><p>Stories told as one evolving scene.</p>{presentations.map(p => <a key={p.slug} href={`/${p.slug}`}>{p.title} →</a>)}</main>}</StrictMode>)
