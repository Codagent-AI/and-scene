import type { ReactNode } from 'react'
import { ATTRIBUTION_URL, STAGE_LAYOUT } from './constants'
import type { Mode, Step } from './types'
import { usePresentationNav } from './usePresentationNav'
import { useWideViewport } from './useFitScale'
import { Stage } from './Stage'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'

export interface PresentationProps<T> {
  steps: readonly Step<T>[]
  title: string
  initialMode?: Mode
  brand?: ReactNode
  attribution?: ReactNode
  designWidth?: number
  designHeight?: number
}
export function Presentation<T>({ steps, title, initialMode = 'browse', brand, attribution, designWidth, designHeight }: PresentationProps<T>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const wide = useWideViewport()
  if (!steps.length) throw new Error('Presentation requires at least one step')
  const geometry = STAGE_LAYOUT[nav.mode]
  const toc = wide && nav.mode === 'browse'
  return <main data-presentation-root="" data-presentation-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.index} aria-label={title} onTouchStart={nav.onTouchStart} onTouchEnd={nav.onTouchEnd} style={{ position: 'fixed', inset: 0, display: 'grid', gridTemplateRows: `${geometry.header}px minmax(0, 1fr) ${geometry.footer}px` }}>
    <Header step={steps[nav.index]} index={nav.index} mode={nav.mode} brand={brand} toggleMode={nav.toggleMode} />
    <div data-presentation-body="" style={{ display: 'grid', minHeight: 0, gridTemplateColumns: toc ? '170px minmax(0, 1fr)' : 'minmax(0, 1fr)' }}>
      {toc && <Toc steps={steps} index={nav.index} jump={nav.jump} />}
      <Stage step={steps[nav.index]} width={designWidth} height={designHeight} />
    </div>
    <Footer steps={steps} index={nav.index} mode={nav.mode} jump={nav.jump} next={nav.next} prev={nav.prev} />
    <aside data-presentation-attribution="" style={{ position: 'absolute', right: 20, bottom: 14 }}>{attribution === undefined ? <a href={ATTRIBUTION_URL}>made by and-scene</a> : attribution}</aside>
  </main>
}
