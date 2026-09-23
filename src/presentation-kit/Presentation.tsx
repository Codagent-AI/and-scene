import { useRef } from 'react'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { DESIGN_H, DESIGN_W, STAGE_LAYOUT } from './constants'
import { Stage } from './Stage'
import type { PresentationProps } from './types'
import { useFitScale } from './useFitScale'
import { usePresentationNav } from './usePresentationNav'

export function Presentation<TPayload>({ steps, title, initialMode = 'present', attribution, className, style }: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const scale = useFitScale(nav.mode)
  const touch = useRef<{ x: number; y: number } | null>(null)
  const step = steps[nav.index]
  if (!step) return null
  const numbered = { ...step, number: nav.index + 1 }
  const layout = STAGE_LAYOUT[nav.mode]
  return <main className={['presentation', `presentation--${nav.mode}`, className].filter(Boolean).join(' ')} data-presentation data-presentation-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.index} style={style}>
    <Header title={title} step={numbered} mode={nav.mode} />
    {nav.mode === 'browse' && <Toc steps={steps} index={nav.index} goTo={nav.goTo} />}
    <section className="presentation-stage-region" data-presentation-stage-region style={{ top: layout.top, bottom: layout.bottom }} onTouchStart={(event) => { const t = event.touches[0]; touch.current = { x: t.clientX, y: t.clientY } }} onTouchEnd={(event) => {
      if (!touch.current) return
      const dx = event.changedTouches[0].clientX - touch.current.x
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(event.changedTouches[0].clientY - touch.current.y)) {
        if (dx < 0) nav.next()
        else nav.prev()
      }
      touch.current = null
    }}>
      <Stage step={step} scale={scale} mode={nav.mode} stepNumber={nav.index + 1} />
    </section>
    <Footer steps={steps} index={nav.index} mode={nav.mode} next={nav.next} prev={nav.prev} goTo={nav.goTo} title={title} toggleMode={nav.toggleMode} />
    {attribution === false ? null : attribution ?? <a className="presentation-attribution" data-presentation-attribution href="https://github.com/and-scene/and-scene">made by and-scene</a>}
    <span hidden data-presentation-design-width={DESIGN_W} data-presentation-design-height={DESIGN_H} />
  </main>
}
