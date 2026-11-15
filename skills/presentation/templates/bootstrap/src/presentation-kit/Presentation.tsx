import type { ReactNode } from 'react'
import type { Mode, Step } from './types'
import { DESIGN_H, DESIGN_W } from './constants'
import { usePresentationNav } from './usePresentationNav'
import { useFitScale } from './useFitScale'
import { Stage } from './Stage'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
export function Presentation<T>({ steps, title, initialMode = 'browse', brand, attribution, designW = DESIGN_W, designH = DESIGN_H }: {
  steps: readonly Step<T>[]; title: string; initialMode?: Mode; brand?: ReactNode; attribution?: ReactNode; designW?: number; designH?: number
}) {
  const nav = usePresentationNav(steps.length, initialMode)
  const fit = useFitScale(nav.mode, designW, designH)
  if (!steps.length) throw new Error('Presentation requires at least one step')
  return <main data-presentation-root="" data-presentation-mode={nav.mode} data-presentation-era={steps[nav.index].era} data-step-count={steps.length} data-step-index={nav.index} aria-label={title} onTouchStart={nav.onTouchStart} onTouchEnd={nav.onTouchEnd} style={{ position: 'relative', minHeight: '100dvh' }}>
    <Header step={steps[nav.index]} index={nav.index} mode={nav.mode} brand={brand} toggle={nav.toggle} />
    {nav.mode === 'browse' && fit.wide && <Toc steps={steps} index={nav.index} go={nav.go} />}
    <div data-presentation-stage-slot="" style={{ position: 'absolute', top: fit.top, bottom: fit.bottom, left: fit.left, right: fit.right, display: 'grid', placeItems: 'center' }}>
      <Stage step={steps[nav.index]} scale={fit.scale} designW={designW} designH={designH} />
    </div>
    <Footer steps={steps} index={nav.index} mode={nav.mode} go={nav.go} prev={nav.prev} next={nav.next} />
    <div data-presentation-attribution-slot="" style={{ position: 'absolute', bottom: 12, right: 16 }}>{attribution === undefined ? <a data-presentation-attribution="" href="https://github.com/Codagent-AI/and-scene">made by and-scene</a> : attribution}</div>
  </main>
}
