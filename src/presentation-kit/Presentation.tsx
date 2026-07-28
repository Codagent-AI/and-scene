import type { ReactNode } from 'react'
import { Stage } from './Stage'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { Attribution } from './chrome/Attribution'
import { usePresentationNav } from './usePresentationNav'
import { useFitScale } from './useFitScale'
import type { PresentationProps } from './types'

export interface PresentationChromeProps<TPayload> extends PresentationProps<TPayload> {
  brand?: ReactNode
}

export function Presentation<TPayload>({ steps, initialMode = 'present', brand }: PresentationChromeProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const scale = useFitScale(nav.mode)
  const step = steps[nav.index]

  // A presentation with no steps is an authoring mistake, not a render error.
  // Emit the root with its step hooks so the verification scripts report a
  // stepless presentation instead of an undefined-property crash.
  if (!step) {
    return <div data-presentation-root="true" data-step-count={0} data-step-index={0} />
  }

  return (
    <div
      data-presentation-root="true"
      data-step-count={steps.length}
      data-step-index={nav.index}
      onTouchStart={nav.handleTouchStart}
      onTouchEnd={nav.handleTouchEnd}
    >
      <Header
        mode={nav.mode}
        era={step.era}
        title={step.title}
        stepIndex={nav.index}
        stepCount={steps.length}
        brand={brand}
      />
      <Stage steps={steps} activeIndex={nav.index} mode={nav.mode} scale={scale} />
      {nav.mode === 'browse' ? <Toc steps={steps} activeIndex={nav.index} onJump={nav.goTo} /> : null}
      <Footer
        mode={nav.mode}
        title={step.title}
        caption={step.caption}
        stepIndex={nav.index}
        stepCount={steps.length}
        onPrev={nav.prev}
        onNext={nav.next}
        onJump={nav.goTo}
      />
      <Attribution />
    </div>
  )
}
