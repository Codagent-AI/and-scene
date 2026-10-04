import { usePresentationNav } from './usePresentationNav'
import { Stage } from './Stage'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { DESIGN_H, DESIGN_W } from './constants'
import type { PresentationProps } from './types'

export function Presentation<T>({ steps, title, initialMode = 'browse', designWidth = DESIGN_W, designHeight = DESIGN_H, className, attribution = <a href="https://github.com/and-scene/and-scene" data-presentation-attribution="">made by and-scene</a>, brand, style }: PresentationProps<T>) {
  const nav = usePresentationNav(steps.length, initialMode)
  if (steps.length === 0) return null
  const step = steps[nav.index]
  return <main className={['presentation', className].filter(Boolean).join(' ')} data-presentation="" data-presentation-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.index} style={style}>
    <Header title={title} mode={nav.mode} section={step.section} index={nav.index} brand={brand} />
    {nav.mode === 'browse' && <Toc steps={steps} index={nav.index} goTo={nav.goTo} />}
    <Stage steps={steps} index={nav.index} mode={nav.mode} designWidth={designWidth} designHeight={designHeight} onTouchStart={nav.onTouchStart} onTouchEnd={nav.onTouchEnd} />
    <Footer title={title} step={step} steps={steps} index={nav.index} mode={nav.mode} goTo={nav.goTo} next={nav.next} prev={nav.prev} />
    {attribution !== false && <aside className="presentation-attribution" data-presentation-attribution-container="">{attribution}</aside>}
  </main>
}
