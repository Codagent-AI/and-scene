import { useRef } from 'react'
import type { ReactNode } from 'react'
import { Stage } from './Stage'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { usePresentationNav } from './usePresentationNav'
import { useViewport } from './useFitScale'
import type { Mode, Step } from './types'
export interface PresentationProps<T> { steps: readonly Step<T>[]; title: string; initialMode?: Mode; brand?: ReactNode; attribution?: ReactNode; className?: string }
export function Presentation<T>({ steps, title, initialMode = 'browse', brand, attribution, className }: PresentationProps<T>) {
  const rootRef = useRef<HTMLDivElement>(null)
  const nav = usePresentationNav(steps.length, initialMode, rootRef)
  const { width } = useViewport()
  if (!steps.length) throw new Error('Presentation requires at least one step')
  return <div ref={rootRef} className={className} data-presentation="" data-presentation-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.index} aria-label={title} style={{ position: 'relative', width: '100%', height: '100dvh', minHeight: 500, overflow: 'hidden', touchAction: 'pan-y' }}>
    <Header step={steps[nav.index]} index={nav.index} mode={nav.mode} brand={brand} />
    <Stage step={steps[nav.index]} mode={nav.mode} />
    {nav.mode === 'browse' && width >= 1000 && <Toc steps={steps} index={nav.index} jump={nav.jump} />}
    <Footer steps={steps} index={nav.index} mode={nav.mode} jump={nav.jump} next={nav.next} prev={nav.prev} />
    <button data-presentation-mode-toggle="" onClick={nav.toggleMode} style={{ position: 'absolute', top: 0, right: 0 }}>{nav.mode === 'browse' ? 'Present' : 'Browse'}</button>
    <div data-presentation-attribution="" style={{ position: 'absolute', bottom: 0, right: 0 }}>{attribution === undefined ? <a href="https://github.com/Codagent-AI/and-scene">made by and-scene</a> : attribution}</div>
  </div>
}
