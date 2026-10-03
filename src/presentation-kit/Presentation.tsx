import { useRef } from 'react'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import { usePresentationNav } from './usePresentationNav'
import type { PresentationProps } from './types'

export function Presentation<T>({ steps, title, initialMode = 'browse', attribution = true, brand }: PresentationProps<T>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const touchStart = useRef(0)
  const step = steps[nav.index]
  if (!step) return null
  return <main className="presentation" data-presentation data-presentation-mode={nav.mode}>
    <Header title={title} step={step} index={nav.index} mode={nav.mode} brand={brand} />
    {nav.mode === 'browse' && <Toc steps={steps} index={nav.index} goTo={nav.goTo} />}
    <Stage step={step} index={nav.index} total={steps.length} mode={nav.mode} onTouchStart={x => { touchStart.current = x }} onTouchEnd={x => { const delta = x - touchStart.current; if (Math.abs(delta) > 48) { if (delta < 0) nav.next(); else nav.prev() } }} />
    <Footer steps={steps} index={nav.index} mode={nav.mode} title={title} next={nav.next} prev={nav.prev} goTo={nav.goTo} toggleMode={nav.toggleMode} attribution={attribution} />
  </main>
}
