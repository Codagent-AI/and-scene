import { useEffect, useState } from 'react'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import { DESIGN_H, DESIGN_W } from './constants'
import { usePresentationNav } from './usePresentationNav'
import type { PresentationProps } from './types'

export function Presentation<T>({ steps, title, initialMode = 'browse', className, attribution, brand, designWidth = DESIGN_W, designHeight = DESIGN_H }: PresentationProps<T>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const [wide, setWide] = useState(false)
  useEffect(() => {
    if (typeof window.matchMedia === 'function') {
      const query = window.matchMedia('(min-width: 900px)')
      const update = () => setWide(query.matches)
      update(); query.addEventListener('change', update)
      return () => query.removeEventListener('change', update)
    }
    const update = () => setWide(window.innerWidth >= 900)
    update(); window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  if (steps.length === 0) return null
  const step = steps[nav.index]
  const disclosure = attribution === null ? null : attribution ?? <a className="presentation-attribution" data-presentation-attribution="" href="https://github.com/and-scene/and-scene">made by and-scene</a>
  return <main className={['presentation', `presentation-${nav.mode}`, className].filter(Boolean).join(' ')} data-presentation="" data-mode={nav.mode} {...nav.touchHandlers}>
    <Header title={title} step={step} index={nav.index} mode={nav.mode} brand={brand} />
    {nav.mode === 'browse' && wide && <Toc steps={steps} index={nav.index} onGoTo={nav.goTo} />}
    <Stage step={step} index={nav.index} total={steps.length} mode={nav.mode} width={designWidth} height={designHeight} />
    <Footer steps={steps} index={nav.index} mode={nav.mode} title={title} onGoTo={nav.goTo} onPrev={nav.prev} onNext={nav.next} attribution={disclosure} />
    <button type="button" className="presentation-mode-toggle" data-presentation-mode-toggle="" onClick={nav.toggleMode} aria-label={`Switch to ${nav.mode === 'browse' ? 'present' : 'browse'} mode`}>P</button>
  </main>
}
