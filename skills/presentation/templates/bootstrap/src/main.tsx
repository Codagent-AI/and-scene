/* The route shell intentionally keeps its small landing view next to routing. */
/* eslint-disable react-refresh/only-export-components */
import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { presentations } from './presentations'
import './index.css'

const slug = window.location.pathname.replace(/^\/+|\/+$/g, '')
const entry = presentations.find((item) => item.slug === slug)
const Route = entry ? lazy(entry.load) : undefined

function App() {
  return <StrictMode><Suspense fallback={<div role="status">Loading presentation…</div>}>
    {Route ? <Route /> : <Landing />}
  </Suspense></StrictMode>
}

function Landing() {
  return <main><h1>Presentations</h1><ul>{presentations.map((item) => <li key={item.slug}><a href={`/${item.slug}`}>{item.title}</a></li>)}</ul></main>
}

createRoot(document.getElementById('root')!).render(<App />)
