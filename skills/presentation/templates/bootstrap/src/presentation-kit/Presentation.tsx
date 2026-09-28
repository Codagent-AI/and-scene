import { useMemo } from 'react'
import { Stage } from './Stage'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import type { TocEra } from './chrome/Toc'
import { Attribution } from './chrome/Attribution'
import { usePresentationNav } from './usePresentationNav'
import { DESIGN_H, DESIGN_W } from './constants'
import type { PresentationProps } from './types'

/** Composes Stage + chrome + navigation from a step list into one runnable presentation. */
export function Presentation({
  steps,
  title,
  initialMode = 'browse',
  designWidth = DESIGN_W,
  designHeight = DESIGN_H,
  attribution,
  brand,
  className,
}: PresentationProps) {
  const nav = usePresentationNav({ stepCount: steps.length, initialMode })
  const activeStep = steps[nav.stepIndex]

  const eras = useMemo<TocEra[]>(() => {
    const seen = new Set<string>()
    const result: TocEra[] = []
    steps.forEach((step, index) => {
      if (!seen.has(step.era)) {
        seen.add(step.era)
        result.push({ era: step.era, firstIndex: index })
      }
    })
    return result
  }, [steps])

  if (!activeStep) return null

  return (
    <div
      className={className}
      data-presentation-root=""
      data-presentation-mode={nav.mode}
      data-step-count={steps.length}
      data-step-index={nav.stepIndex}
      style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}
    >
      <Header title={title} mode={nav.mode} activeStep={activeStep} brand={brand} onToggleMode={nav.toggleMode} />
      <div
        className="presentation-body"
        data-presentation-body=""
        style={{ display: 'flex', flex: '1 1 auto', minHeight: 0 }}
        {...nav.swipeHandlers}
      >
        <Stage
          steps={steps}
          stepIndex={nav.stepIndex}
          mode={nav.mode}
          designWidth={designWidth}
          designHeight={designHeight}
        />
        {nav.mode === 'browse' ? <Toc eras={eras} activeEra={activeStep.era} onSelect={nav.goTo} /> : null}
      </div>
      <Footer
        mode={nav.mode}
        activeStep={activeStep}
        stepIndex={nav.stepIndex}
        stepCount={steps.length}
        atStart={nav.atStart}
        atEnd={nav.atEnd}
        onNext={nav.next}
        onPrev={nav.prev}
        onGoTo={nav.goTo}
      />
      <Attribution options={attribution} />
    </div>
  )
}
