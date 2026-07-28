import { Stage } from './Stage'
import { Attribution } from './chrome/Attribution'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { DESIGN_H, DESIGN_W } from './constants'
import { useFitScale } from './useFitScale'
import { useIsWideViewport } from './useIsWideViewport'
import { usePresentationNav } from './usePresentationNav'
import type { PresentationProps } from './types'

export function Presentation<TPayload>({ steps, initialMode }: PresentationProps<TPayload>) {
  const { index, mode, next, prev, goTo, stageRef } = usePresentationNav({
    stepCount: steps.length,
    initialMode,
  })
  const scale = useFitScale(mode)
  const isWide = useIsWideViewport()

  // An empty deck has no scene to draw. Render the enumeration hooks anyway so
  // verification reports an unusable step count instead of a render crash.
  if (steps.length === 0) {
    return <div data-presentation-root="" data-step-count={0} data-step-index={0} />
  }

  // `index` is already clamped to the current step count by usePresentationNav,
  // so a deck that shrinks while mounted falls back to its last step.
  const activeStep = steps[index]
  const marker = String(index + 1).padStart(2, '0')

  return (
    <div
      data-presentation-root=""
      data-step-count={steps.length}
      data-step-index={index}
      ref={stageRef}
      style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
    >
      <Header mode={mode} marker={marker} title={activeStep.title} />

      <div
        data-presentation-canvas-viewport=""
        style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
      >
        <div
          data-presentation-canvas=""
          style={{ width: DESIGN_W, height: DESIGN_H, transform: `scale(${scale})` }}
        >
          <Stage steps={steps} activeIndex={index} />
        </div>
      </div>

      {mode === 'browse' && isWide ? (
        <Toc steps={steps} activeIndex={index} onSelectEra={goTo} />
      ) : null}

      <Footer
        mode={mode}
        title={activeStep.title}
        caption={activeStep.caption}
        stepCount={steps.length}
        activeIndex={index}
        onGoTo={goTo}
        onNext={next}
        onPrev={prev}
      />

      <Attribution />
    </div>
  )
}
