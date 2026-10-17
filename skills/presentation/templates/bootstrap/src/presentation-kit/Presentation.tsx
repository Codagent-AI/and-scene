import { Footer } from './chrome/Footer.tsx'
import { Header } from './chrome/Header.tsx'
import { Toc } from './chrome/Toc.tsx'
import { TOC_MIN_WIDTH } from './constants.ts'
import { Stage } from './Stage.tsx'
import type { PresentationProps } from './types.ts'
import { usePresentationNav } from './usePresentationNav.ts'
import { useViewport } from './useViewport.ts'

export function Presentation({ steps, title, initialMode = 'present', brand, attribution, className }: PresentationProps) {
  const { index, mode, next, prev, goTo } = usePresentationNav(steps.length, initialMode)
  const { width } = useViewport()
  const step = steps[index]
  const count = steps.length
  if (!step) return null

  return (
    <div
      data-presentation-root
      className={className}
      data-presentation-mode={mode}
      data-step-count={count}
      data-step-index={index}
      data-presentation-step-count={count}
      data-presentation-step-index={index}
      style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}
    >
      <Header mode={mode} deckTitle={title} era={step.era} index={index} count={count} brand={brand} />
      <Stage step={step} stepIndex={index} mode={mode} />
      {mode === 'browse' && width >= TOC_MIN_WIDTH ? <Toc steps={steps} index={index} onGoTo={goTo} /> : null}
      <Footer
        mode={mode}
        step={step}
        steps={steps}
        index={index}
        onGoTo={goTo}
        onPrev={prev}
        onNext={next}
        attribution={attribution}
      />
    </div>
  )
}
