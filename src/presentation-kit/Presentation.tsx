import { Attribution } from './chrome/Attribution'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { DEFAULT_CANVAS } from './constants'
import { Stage } from './Stage'
import { useFitScale } from './useFitScale'
import { usePresentationNav } from './usePresentationNav'
import type { PresentationProps } from './types'

/** Composes the stage, chrome, and navigation for an ordered list of steps. */
export function Presentation({
  steps,
  title,
  initialMode = 'browse',
  initialIndex = 0,
  brand,
  attribution,
  canvas = DEFAULT_CANVAS,
  className,
}: PresentationProps) {
  const nav = usePresentationNav({ count: steps.length, initialIndex, initialMode })
  const fit = useFitScale(nav.mode, canvas)
  const step = steps[nav.index]
  if (!step) return null
  return (
    <div
      data-presentation-root
      data-presentation-mode={nav.mode}
      data-step-count={steps.length}
      data-step-index={nav.index}
      aria-label={title}
      className={className}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}
    >
      <Header brand={brand} number={nav.index + 1} era={step.era} />
      {fit.tocVisible ? <Toc steps={steps} activeIndex={nav.index} onJump={nav.goTo} /> : null}
      <Stage step={step} fit={fit} canvas={canvas} />
      <Footer
        mode={nav.mode}
        steps={steps}
        index={nav.index}
        onPrev={nav.prev}
        onNext={nav.next}
        onJump={nav.goTo}
      />
      <Attribution override={attribution} />
    </div>
  )
}
