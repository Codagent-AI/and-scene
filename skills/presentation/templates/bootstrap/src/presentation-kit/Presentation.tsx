import { useEffect, useState } from 'react'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import { clampStep, usePresentationNav } from './usePresentationNav'
import type { PresentationProps } from './types'

function useWideViewport() {
  const [wide, setWide] = useState(() => typeof window === 'undefined' || window.innerWidth >= 900)

  useEffect(() => {
    const update = () => setWide(window.innerWidth >= 900)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return wide
}

export function Presentation<TPayload>({ steps, title, initialMode = 'browse' }: PresentationProps<TPayload>) {
  if (steps.length === 0) throw new Error('Presentation requires at least one step.')

  const nav = usePresentationNav(steps.length, initialMode)
  const wide = useWideViewport()
  const stepIndex = clampStep(nav.stepIndex, steps.length)
  const step = steps[stepIndex]!

  return (
    <main
      data-presentation="true"
      data-presentation-mode={nav.mode}
      data-step-count={steps.length}
      data-step-index={stepIndex}
      onTouchEnd={nav.onTouchEnd}
      onTouchStart={nav.onTouchStart}
      data-testid="presentation"
      style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}
    >
      <Header mode={nav.mode} step={step} title={title} />
      {nav.mode === 'browse' && wide ? <Toc steps={steps} stepIndex={stepIndex} onGoTo={nav.goTo} /> : null}
      <Stage mode={nav.mode} step={step} stepCount={steps.length} stepIndex={stepIndex} />
      <Footer mode={nav.mode} step={step} stepIndex={stepIndex} steps={steps} onGoTo={nav.goTo} onNext={nav.next} onPrev={nav.prev} />
      <button aria-label={`Switch to ${nav.mode === 'browse' ? 'present' : 'browse'} mode`} data-presentation-mode-toggle="true" onClick={nav.toggleMode} type="button">{nav.mode === 'browse' ? 'Present' : 'Browse'}</button>
      <a data-presentation-attribution="true" href="https://github.com/Codagent-AI/and-scene" style={{ bottom: 0, position: 'fixed', right: 0 }}>made by and-scene</a>
    </main>
  )
}
