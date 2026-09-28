import { useMemo } from 'react'
import { Stage } from './Stage'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { STAGE_LAYOUT, TOC_MIN_WIDTH } from './constants'
import { useFitScale } from './useFitScale'
import { usePresentationNav } from './usePresentationNav'
import { useViewportWidth } from './useViewportWidth'
import type { PresentationProps } from './types'

/**
 * Composes the Stage, chrome, and navigation for a full presentation from
 * an ordered `steps[]`. Presentations supply steps and a title; the kit owns
 * behavior, layout geometry, and stable DOM hooks only.
 */
export function Presentation<TPayload>({ steps, title, initialMode = 'browse', brand }: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const viewportWidth = useViewportWidth()
  const showToc = nav.mode === 'browse' && viewportWidth >= TOC_MIN_WIDTH
  const scale = useFitScale(nav.mode, showToc)
  const layout = STAGE_LAYOUT[nav.mode]
  const activeStep = steps[nav.stepIndex]

  const eras = useMemo(() => {
    const seen = new Map<string, number>()
    steps.forEach((step, index) => {
      if (!seen.has(step.era)) seen.set(step.era, index)
    })
    return Array.from(seen.entries()).map(([era, firstIndex]) => ({ era, firstIndex }))
  }, [steps])

  if (!activeStep) {
    return (
      <div
        className="and-scene-presentation"
        data-presentation-root=""
        data-presentation-mode={nav.mode}
        data-step-count={0}
        data-step-index={0}
        data-presentation-empty=""
      />
    )
  }

  return (
    <div
      className="and-scene-presentation"
      data-presentation-root=""
      data-presentation-mode={nav.mode}
      data-step-count={steps.length}
      data-step-index={nav.stepIndex}
      style={{ position: 'relative', minHeight: '100dvh' }}
    >
      <Header mode={nav.mode} title={title} activeStep={activeStep} brand={brand} />
      <Stage
        steps={steps}
        stepIndex={nav.stepIndex}
        scale={scale}
        style={{ position: 'absolute', top: layout.chromeTop, bottom: layout.chromeBottom, left: 0, right: 0 }}
      />
      {showToc ? <Toc eras={eras} activeIndex={nav.stepIndex} onSelect={nav.goTo} /> : null}
      <Footer
        mode={nav.mode}
        activeStep={activeStep}
        stepIndex={nav.stepIndex}
        stepCount={steps.length}
        onNext={nav.next}
        onPrev={nav.prev}
        onGoTo={nav.goTo}
        onToggleMode={nav.toggleMode}
      />
    </div>
  )
}
