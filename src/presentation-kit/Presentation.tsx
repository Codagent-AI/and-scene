import type { ReactNode } from 'react'
import { Stage } from './Stage'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { useFitScale } from './useFitScale'
import { usePresentationNav } from './usePresentationNav'
import type { Mode, Step } from './types'

export interface PresentationProps<T> {
  steps: readonly Step<T>[]
  title: string
  initialMode?: Mode
  className?: string
  brand?: ReactNode
  attribution?: ReactNode
}
export function Presentation<T>({ steps, title, initialMode = 'browse', className, brand, attribution }: PresentationProps<T>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const fit = useFitScale(nav.mode)
  if (steps.length === 0) throw new Error('A presentation requires at least one step')
  const step = steps[nav.index]
  return <main data-presentation-root="" data-presentation="" data-presentation-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.index} aria-label={title} className={className} onTouchStart={nav.onTouchStart} onTouchEnd={nav.onTouchEnd} style={{ position: 'relative', width: '100%', minHeight: '100dvh' }}>
    <Header step={step} index={nav.index} mode={nav.mode} brand={brand} toggleMode={nav.toggleMode} />
    <div data-presentation-stage-region="" style={{ position: 'absolute', ...fit.geometry }}>
      <Stage step={step} stepIndex={nav.index} scale={fit.scale} />
    </div>
    {nav.mode === 'browse' && fit.wide && <Toc steps={steps} index={nav.index} jump={nav.jump} />}
    <Footer steps={steps} index={nav.index} mode={nav.mode} next={nav.next} prev={nav.prev} jump={nav.jump} />
    <div data-presentation-attribution-slot="" style={{ position: 'absolute', bottom: 0, right: 0 }}>{attribution === undefined ? <a data-presentation-attribution="" href="https://github.com/Codagent-AI/and-scene">made by and-scene</a> : attribution}</div>
  </main>
}
