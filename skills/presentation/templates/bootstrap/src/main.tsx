import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { presentations } from './presentations'
import './presentation-kit/layout.css'

const entry = presentations.find(({ slug }) => location.pathname.replace(/^\/+|\/+$/g, '') === slug)
const Talk = entry ? lazy(entry.load) : undefined
export function App() {
  return Talk ? <Suspense fallback={<p>Loading presentation…</p>}><Talk /></Suspense> : <main><h1>Presentations</h1>{presentations.map(({ slug, title }) => <p key={slug}><a href={`/${slug}`}>{title}</a></p>)}</main>
}
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
