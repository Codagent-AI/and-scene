import { lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { presentations } from './presentations'
import './index.css'

const slug = window.location.pathname.split('/').filter(Boolean)[0]
const entry = presentations.find((item) => item.slug === slug)
const Route = entry ? lazy(entry.load) : null

createRoot(document.getElementById('root')!).render(Route ? <Suspense fallback={<p>Loading…</p>}><Route /></Suspense> : <main><h1>Presentations</h1>{presentations.map((item) => <p key={item.slug}><a href={`/${item.slug}`}>{item.title}</a></p>)}</main>)
