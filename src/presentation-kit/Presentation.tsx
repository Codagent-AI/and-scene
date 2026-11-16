import type { ReactNode } from 'react'
import type { Mode, Step } from './types'
import { DESIGN_H, DESIGN_W } from './constants'
import { Stage } from './Stage'
import { useFitScale } from './useFitScale'
import { usePresentationNav } from './usePresentationNav'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
export interface PresentationProps<T> { steps: readonly Step<T>[]; title: string; initialMode?: Mode; brand?: ReactNode; attribution?: ReactNode; width?: number; height?: number }
export function Presentation<T>({ steps, title, initialMode = 'browse', brand, attribution, width = DESIGN_W, height = DESIGN_H }: PresentationProps<T>) {
  if (!steps.length) throw new Error('Presentation requires at least one step')
  return <PresentationHost steps={steps} title={title} initialMode={initialMode} brand={brand} attribution={attribution} width={width} height={height} />
}
function PresentationHost<T>({ steps, title, initialMode, brand, attribution, width = DESIGN_W, height = DESIGN_H }: PresentationProps<T>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const fit = useFitScale(nav.mode, width, height)
  const step = steps[nav.index]
  return <main data-presentation-root="" data-step-count={steps.length} data-step-index={nav.index} data-presentation-mode={nav.mode} style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }}>
    <Header title={title} marker={`${String(nav.index + 1).padStart(2, '0')} / ${step.era}`} mode={nav.mode} toggle={nav.toggle} brand={brand} />
    {nav.mode === 'browse' && fit.wide && <Toc steps={steps} index={nav.index} go={nav.go} />}
    <div data-presentation-stage="" style={{ position: 'absolute', left: fit.left, top: fit.top, width: fit.width, height: fit.height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Stage step={step} scale={fit.scale} width={width} height={height} />
    </div>
    <Footer steps={steps} index={nav.index} mode={nav.mode} go={nav.go} prev={nav.prev} next={nav.next} />
    <aside data-presentation-attribution="" style={{ position: 'absolute', bottom: 16, right: 24 }}>{attribution === undefined ? <a href="https://github.com/Codagent-AI/and-scene">made by and-scene</a> : attribution}</aside>
  </main>
}
