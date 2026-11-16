import { useId } from 'react'
import type { ReactNode } from 'react'
import { Stage } from './Stage'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { usePresentationNav } from './usePresentationNav'
import { useViewport } from './useFitScale'
import { STAGE_LAYOUT } from './constants'
import type { Mode, Step } from './types'
export function Presentation<T>({ steps, title, initialMode = 'browse', brand, attribution, canvas }: { steps: Step<T>[]; title: string; initialMode?: Mode; brand?: ReactNode; attribution?: ReactNode; canvas?: { width: number; height: number } }) {
  const nav = usePresentationNav(steps.length, initialMode)
  const namespace = useId()
  const [width] = useViewport()
  if (!steps.length) throw new Error('Presentation requires at least one step')
  const geometry = STAGE_LAYOUT[nav.mode]
  return <main data-presentation="" data-presentation-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.index} onTouchStart={nav.onTouchStart} onTouchEnd={nav.onTouchEnd} style={{ minHeight: '100dvh', position: 'relative' }}>
    <Header step={steps[nav.index]} index={nav.index} mode={nav.mode} title={title} brand={brand} />
    <button style={{ position: 'absolute', right: 24, top: 24 }} data-presentation-mode-toggle="" onClick={nav.toggle} aria-label="Toggle presentation mode">{nav.mode === 'browse' ? 'Present ↗' : 'Browse ↙'}</button>
    {nav.mode === 'browse' && width >= 1100 && <Toc steps={steps} index={nav.index} go={nav.go} />}
    <div data-presentation-stage-slot="" style={{ position: 'absolute', top: geometry.top, bottom: geometry.bottom, left: geometry.horizontal + (width >= 1100 ? geometry.toc : 0), right: geometry.horizontal, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Stage step={steps[nav.index]} mode={nav.mode} namespace={namespace} width={canvas?.width} height={canvas?.height} /></div>
    <Footer steps={steps} index={nav.index} mode={nav.mode} go={nav.go} prev={nav.prev} next={nav.next} />
    <div data-presentation-attribution-slot="" style={{ position: 'absolute', bottom: 18, right: 24 }}>{attribution ?? <a data-presentation-attribution="" href="https://github.com/Codagent-AI/and-scene">made by and-scene</a>}</div>
  </main>
}
