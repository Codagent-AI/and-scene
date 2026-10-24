import type { ReactNode } from 'react'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import { validateSteps } from './types'
import type { Mode, Step } from './types'
import { usePresentationNav } from './usePresentationNav'
export interface PresentationProps<T> {
  steps: readonly Step<T>[]
  title: string
  initialMode?: Mode
  brand?: ReactNode
  attribution?: ReactNode | false
  width?: number
  height?: number
}
export function Presentation<T>({ steps, title, initialMode = 'browse', brand, attribution, width, height }: PresentationProps<T>) {
  validateSteps(steps)
  const nav = usePresentationNav(steps.length, initialMode)
  return <main data-presentation="" data-presentation-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.index} aria-label={title} style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }} onTouchStart={nav.onTouchStart} onTouchEnd={nav.onTouchEnd}>
    <Header step={steps[nav.index]} index={nav.index} mode={nav.mode} brand={brand} />
    <Stage step={steps[nav.index]} mode={nav.mode} width={width} height={height} />
    {nav.mode === 'browse' && <Toc steps={steps} index={nav.index} jump={nav.jump} />}
    <Footer steps={steps} index={nav.index} mode={nav.mode} next={nav.next} prev={nav.prev} jump={nav.jump} />
    <button data-presentation-mode-toggle="" aria-label={`Switch to ${nav.mode === 'browse' ? 'present' : 'browse'} mode`} onClick={nav.toggle} style={{ position: 'absolute', right: 24, top: 20 }}>{nav.mode === 'browse' ? 'Present ↗' : 'Browse ↙'}</button>
    {attribution !== false && <div data-presentation-attribution-container="" style={{ position: 'absolute', right: 24, bottom: 12 }}>{attribution ?? <a data-presentation-attribution="" href="https://github.com/Codagent-AI/and-scene">made by and-scene</a>}</div>}
  </main>
}
