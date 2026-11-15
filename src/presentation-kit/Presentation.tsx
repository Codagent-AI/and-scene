import type { ReactNode } from 'react'
import type { Mode, Step } from './types'
import { validateSteps } from './types'
import { DESIGN_H, DESIGN_W, STAGE_LAYOUT } from './constants'
import { Stage } from './Stage'
import { useFitScale } from './useFitScale'
import { usePresentationNav } from './usePresentationNav'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
export function Presentation<T>({ steps, title, initialMode = 'browse', brand, attribution, width = DESIGN_W, height = DESIGN_H }: {
  steps: readonly Step<T>[]; title: string; initialMode?: Mode; brand?: ReactNode; attribution?: ReactNode; width?: number; height?: number
}) {
  validateSteps(steps)
  const nav = usePresentationNav(steps.length, initialMode)
  const { scale, wide } = useFitScale(nav.mode, width, height)
  const layout = STAGE_LAYOUT[nav.mode]
  return <main data-presentation="" data-presentation-mode={nav.mode} data-step-id={steps[nav.index].id} data-step-era={steps[nav.index].era} data-step-count={steps.length} data-step-index={nav.index} aria-label={title} style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }} onTouchStart={nav.onTouchStart} onTouchEnd={nav.onTouchEnd}>
    <Header step={steps[nav.index]} index={nav.index} mode={nav.mode} brand={brand} toggleMode={nav.toggleMode} />
    {nav.mode === 'browse' && wide && <Toc steps={steps} index={nav.index} jump={nav.jump} />}
    <div style={{ position: 'absolute', top: layout.top, bottom: layout.bottom, left: wide && nav.mode === 'browse' ? 210 : 0, right: 0, display: 'grid', placeItems: 'center' }}>
      <Stage step={steps[nav.index]} scale={scale} width={width} height={height} />
    </div>
    <Footer steps={steps} index={nav.index} mode={nav.mode} jump={nav.jump} prev={nav.prev} next={nav.next} />
    <aside style={{ position: 'absolute', right: 24, bottom: 12 }} data-presentation-attribution-slot="">{attribution === undefined ? <a data-presentation-attribution="" href="https://github.com/Codagent-AI/and-scene">made by and-scene</a> : attribution}</aside>
  </main>
}
