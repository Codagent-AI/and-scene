import type { ReactNode } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { PresentationMode, Step } from './types'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import { usePresentationNav } from './usePresentationNav'

export interface PresentationProps<TPayload> {
  steps: Step<TPayload>[]
  title: string
  initialMode?: PresentationMode
  attribution?: { label: string; href: string } | false
  brand?: ReactNode
}

export function Presentation<TPayload>({ steps, title, initialMode = 'browse', attribution, brand }: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const [wideViewport, setWideViewport] = useState(() => window.innerWidth >= 900)
  useEffect(() => {
    const update = () => setWideViewport(window.innerWidth >= 900)
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  const swipeCleanup = useRef<(() => void) | undefined>(undefined)
  const bindSwipe = nav.bindSwipe
  const setRoot = useCallback((element: HTMLElement | null) => {
    swipeCleanup.current?.()
    swipeCleanup.current = bindSwipe(element)
  }, [bindSwipe])
  useEffect(() => () => swipeCleanup.current?.(), [])
  const active = steps[nav.index]
  return <section ref={setRoot} aria-label="Presentation" role="region" data-presentation-root data-presentation-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.index} style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
    <Header title={active?.title ?? title} era={active?.era ?? ''} stepNumber={nav.index + 1} mode={nav.mode} brand={brand} />
    {nav.mode === 'browse' && wideViewport && <Toc steps={steps} index={nav.index} onGoTo={nav.goTo} />}
    <div data-presentation-stage-shell style={{ position: 'absolute', inset: '0 0 0 0', overflow: 'hidden' }}>
      {steps.length > 0 && <Stage steps={steps} index={nav.index} mode={nav.mode} />}
    </div>
    {active && <Footer mode={nav.mode} title={active.title} caption={active.caption} index={nav.index} count={steps.length} onGoTo={nav.goTo} onNext={nav.next} onPrev={nav.prev} attribution={attribution} />}
    <button type="button" aria-label={`${nav.mode === 'browse' ? 'Present' : 'Browse'} mode`} data-presentation-mode-toggle onClick={nav.toggleMode} style={{ position: 'fixed', right: 24, top: 20 }}>{nav.mode === 'browse' ? 'Present' : 'Browse'}</button>
  </section>
}
