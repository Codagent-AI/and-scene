import './geometry.css'
import type { PresentationProps } from './types'
import { Stage } from './Stage'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { usePresentationNav } from './usePresentationNav'
export function Presentation<T>({ steps, title, initialMode = 'browse', brand, attribution }: PresentationProps<T>) {
 const nav = usePresentationNav(steps.length, initialMode)
 if (!steps.length) return <p role="alert">This presentation has no steps.</p>
 const step = steps[nav.index]
 return <main data-presentation-root data-presentation-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.index} aria-label={title} onTouchStart={nav.onTouchStart} onTouchEnd={nav.onTouchEnd} style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
 <Header brand={brand} title={step.title} marker={`${String(nav.index + 1).padStart(2, '0')} / ${steps.length}`} />
 <button data-presentation-mode-toggle onClick={nav.toggle} aria-label="Toggle presentation mode">{nav.mode === 'browse' ? 'Present' : 'Browse'}</button>
 {nav.mode === 'browse' && <Toc steps={steps} index={nav.index} jump={nav.jump} />}
 <Stage step={step} mode={nav.mode} />
 {nav.mode === 'browse' && <Footer steps={steps} index={nav.index} jump={nav.jump} next={nav.next} prev={nav.prev} />}
 <aside data-presentation-attribution style={{ position: 'absolute', right: 16, bottom: 12 }}>{attribution ?? <a href="https://github.com/Codagent-AI/and-scene">made by and-scene</a>}</aside>
 </main>
}
