import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Host } from '../../../src/Host'
import '../../../src/index.css'
import './scene.css'

const entries = [{ slug: 'scene-kit', title: 'Scene kit exercise', load: () => import('./Talk') }]
createRoot(document.getElementById('root')!).render(<StrictMode><Host pathname="/scene-kit" entries={entries} /></StrictMode>)
