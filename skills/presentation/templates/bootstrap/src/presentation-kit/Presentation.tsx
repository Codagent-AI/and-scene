import { useEffect, useState, type ReactNode } from 'react'
import type { Step } from './types'
import { usePresentationNav, type Mode } from './usePresentationNav'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
export type PresentationProps<T> = { steps: readonly Step<T>[]; title: string; initialMode?: Mode; brand?: ReactNode; attribution?: false|string }
export function Presentation<T>({ steps, title, initialMode = 'present', brand, attribution }: PresentationProps<T>) {
 const nav = usePresentationNav(steps.length, initialMode)
 const [wide, setWide] = useState(() => window.innerWidth >= 900)
 useEffect(() => { const resize = () => setWide(window.innerWidth >= 900); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize) }, [])
 return <main data-presentation-root data-presentation-mode={nav.mode} style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}><Header title={title} mode={nav.mode} index={nav.index} brand={brand} /><Stage steps={steps} index={nav.index} mode={nav.mode} onSwipe={delta => delta > 0 ? nav.next() : nav.prev()} />{nav.mode === 'browse' && wide && <Toc steps={steps} index={nav.index} onJump={nav.goTo} />}<Footer steps={steps} index={nav.index} mode={nav.mode} onJump={nav.goTo} onNext={nav.next} onPrev={nav.prev} attribution={attribution} /><button type="button" data-presentation-mode-toggle aria-label="Toggle presentation mode" onClick={nav.toggleMode}>{nav.mode === 'browse' ? 'Present' : 'Browse'}</button></main>
}
