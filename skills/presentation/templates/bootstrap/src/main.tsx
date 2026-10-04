import { StrictMode, Suspense, createElement, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { presentations } from './presentations'
import './index.css'

const routes = new Map(presentations.map((item) => [item.slug, lazy(item.load)]))
export default function App() {
  const slug = window.location.pathname.split('/').filter(Boolean)[0]
  const Route = slug ? routes.get(slug) : undefined
  if (!Route) return <main><h1>Presentations</h1><ul>{presentations.map((item) => <li key={item.slug}><a href={`/${item.slug}`}>{item.title}</a></li>)}</ul></main>
  return <Suspense fallback={<main>Loading presentation…</main>}>{createElement(Route)}</Suspense>
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
