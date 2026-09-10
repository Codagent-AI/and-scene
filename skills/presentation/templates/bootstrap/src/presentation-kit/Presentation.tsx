import { useRef } from 'react'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import { usePresentationNav } from './usePresentationNav'
import type { PresentationProps } from './types'

export function Presentation<TPayload>({ steps, title, initialMode = 'browse', headerStart }: PresentationProps<TPayload>) {
  const container = useRef<HTMLElement>(null)
  const { index, mode, goTo, next, prev, toggleMode, onTouchStart, onTouchEnd } = usePresentationNav(steps.length, initialMode)
  const activeStep = steps[index]
  if (!activeStep) return null

  return (
    <main
      ref={container}
      data-testid="presentation-root"
      data-presentation-root="true"
      data-presentation-mode={mode}
      data-step-count={steps.length}
      data-step-index={index}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{ minHeight: '100vh', position: 'relative' }}
    >
      <Header title={title} step={activeStep} mode={mode} start={headerStart} />
      {mode === 'browse' && <Toc steps={steps} index={index} goTo={goTo} />}
      <section aria-label="Presentation diagram" data-presentation-canvas-host="true" style={{ height: 'calc(100vh - 1px)' }}>
        <Stage activeStep={activeStep} previousStep={steps[index - 1]} mode={mode} container={container} />
      </section>
      <Footer title={title} steps={steps} index={index} mode={mode} goTo={goTo} prev={prev} next={next} />
      <button type="button" aria-label={`Switch to ${mode === 'browse' ? 'present' : 'browse'} mode`} data-presentation-mode-toggle="true" onClick={toggleMode}>Switch mode</button>
      <a href="https://github.com/and-scene/and-scene" data-presentation-attribution="true" style={{ position: 'fixed', right: 0, bottom: 0 }}>made by and-scene</a>
    </main>
  )
}
