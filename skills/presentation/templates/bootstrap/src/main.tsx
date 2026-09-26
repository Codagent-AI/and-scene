import React from 'react'
import ReactDOM from 'react-dom/client'
import { presentations } from './presentations/index.js'
import './index.css'

const slug = window.location.pathname.split('/').filter(Boolean)[0]
const selected = presentations.find((entry) => entry.slug === slug)
const Root = selected ? React.lazy(selected.load) : null

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{Root ? <React.Suspense fallback={<p>Loading presentation…</p>}><Root /></React.Suspense> : <main><h1>Presentations</h1><ul>{presentations.map((entry) => <li key={entry.slug}><a href={`/${entry.slug}`}>{entry.title}</a></li>)}</ul></main>}</React.StrictMode>,
)
