import type { PresentationMode, Step } from '../types'

export interface FooterProps {
  mode: PresentationMode
  activeStep: Step
  stepIndex: number
  stepCount: number
  atStart: boolean
  atEnd: boolean
  onNext: () => void
  onPrev: () => void
  onGoTo: (index: number) => void
}

/** Browse mode: caption, progress dots, prev/next. Present mode hides all of it. */
export function Footer({
  mode,
  activeStep,
  stepIndex,
  stepCount,
  atStart,
  atEnd,
  onNext,
  onPrev,
  onGoTo,
}: FooterProps) {
  if (mode === 'present') {
    return <footer data-presentation-footer="" data-presentation-mode="present" />
  }

  return (
    <footer data-presentation-footer="" data-presentation-mode="browse">
      <p data-presentation-caption="">{activeStep.caption}</p>
      <nav aria-label="Step progress" data-presentation-progress="">
        {Array.from({ length: stepCount }, (_, index) => {
          const active = index === stepIndex
          return (
            <button
              key={index}
              type="button"
              data-presentation-progress-dot=""
              data-presentation-active={active ? 'true' : 'false'}
              aria-current={active ? 'step' : undefined}
              aria-label={`Go to step ${index + 1}`}
              onClick={() => onGoTo(index)}
            >
              {index + 1}
            </button>
          )
        })}
      </nav>
      <div data-presentation-controls="">
        <button type="button" data-presentation-prev="" disabled={atStart} onClick={onPrev}>
          Previous
        </button>
        <button type="button" data-presentation-next="" disabled={atEnd} onClick={onNext}>
          Next
        </button>
      </div>
    </footer>
  )
}
