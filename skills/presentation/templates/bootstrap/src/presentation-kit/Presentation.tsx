import { useEffect } from 'react'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import { usePresentationNav } from './usePresentationNav'
import type { PresentationProps } from './types'
import './presentation-kit.css'

export function Presentation<TPayload>({ steps, title, initialMode = 'browse', className, style, branding, attribution, designSize }: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const { next, prev, goTo } = nav
  const step = steps[nav.index]
  useEffect(() => {
    const onSwipe = (event: Event) => (event as CustomEvent<{ direction: 'next' | 'prev' }>).detail.direction === 'next' ? next() : prev()
    window.addEventListener('presentation:swipe', onSwipe)
    return () => window.removeEventListener('presentation:swipe', onSwipe)
  }, [next, prev])
  useEffect(() => { if (nav.index >= steps.length) goTo(steps.length - 1) }, [nav.index, goTo, steps.length])
  if (!step) return null
  return <main className={['presentation', `presentation--${nav.mode}`, className].filter(Boolean).join(' ')} style={style} data-presentation="" data-presentation-mode={nav.mode}>
    <Header title={nav.mode === 'browse' ? title : step.title} mode={nav.mode} index={nav.index} branding={branding} />
    <Stage step={step} index={nav.index} mode={nav.mode} width={designSize?.width} height={designSize?.height} />
    <div className="presentation-chrome">
      {nav.mode === 'browse' && <Toc steps={steps} activeIndex={nav.index} onSelect={nav.goTo} />}
      <Footer steps={steps} index={nav.index} mode={nav.mode} onSelect={nav.goTo} onPrev={nav.prev} onNext={nav.next} attribution={attribution} />
    </div>
    <button type="button" className="presentation-mode-toggle" onClick={nav.toggleMode} aria-label={`Switch to ${nav.mode === 'browse' ? 'present' : 'browse'} mode`} data-presentation-mode-toggle="">{nav.mode === 'browse' ? 'Present' : 'Browse'}</button>
  </main>
}
