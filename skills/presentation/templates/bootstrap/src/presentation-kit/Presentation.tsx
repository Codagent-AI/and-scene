import type { ReactNode } from 'react'
import type { Mode, Step } from './types'
import { validateSteps } from './types'
import { usePresentationNav } from './usePresentationNav'
import { fitScale, useViewport } from './useFitScale'
import { Stage } from './Stage'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { ATTRIBUTION_URL, DESIGN_H, DESIGN_W, STAGE_LAYOUT } from './constants'
export function Presentation<T>({ steps, title, initialMode = 'browse', brand, width = DESIGN_W, height = DESIGN_H }: { steps: readonly Step<T>[]; title: string; initialMode?: Mode; brand?: ReactNode; width?: number; height?: number }) {
  validateSteps(steps)
  const nav = usePresentationNav(steps.length, initialMode)
  const viewport = useViewport()
  const scale = fitScale(viewport.width, viewport.height, nav.mode, width, height)
  const geometry = STAGE_LAYOUT[nav.mode]
  return <main aria-label={title} data-presentation="" data-presentation-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.index} onTouchStart={nav.onTouchStart} onTouchEnd={nav.onTouchEnd} style={{ position: 'relative', minHeight: '100dvh' }}>
    <Header step={steps[nav.index]} index={nav.index} mode={nav.mode} brand={brand} />
    <button data-presentation-mode-toggle="" aria-label="Toggle presentation mode" onClick={nav.toggle}>{nav.mode === 'browse' ? 'Present' : 'Browse'}</button>
    <div data-presentation-stage-slot="" style={{ position: 'absolute', top: geometry.top, bottom: geometry.bottom, left: geometry.left, right: geometry.right, display: 'grid', placeItems: 'center' }}>
      <Stage step={steps[nav.index]} scale={scale} width={width} height={height} />
    </div>
    {nav.mode === 'browse' && viewport.width >= 1100 && <Toc steps={steps} index={nav.index} jump={nav.jump} />}
    <Footer steps={steps} index={nav.index} mode={nav.mode} jump={nav.jump} next={nav.next} prev={nav.prev} />
    <a data-presentation-attribution="" href={ATTRIBUTION_URL} style={{ position: 'absolute', bottom: 12, right: 16 }}>made by and-scene</a>
  </main>
}
