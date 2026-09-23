import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { presentations } from './presentations'
import { resolvePresentation } from './presentation-kit/routing'
import './presentation-kit/layout.css'

const entry = resolvePresentation(location.pathname, presentations)
const Talk = entry ? lazy(entry.load) : undefined
export function App() {
  return Talk ? <Suspense fallback={<p>Loading presentation…</p>}><Talk /></Suspense> : <main><h1>Presentations</h1>{presentations.map(({ slug, title }) => <p key={slug}><a href={`/${slug}`}>{title}</a></p>)}</main>
}
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
