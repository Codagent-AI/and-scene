import type { PresentationMode, Step } from '../types.ts'

type FooterProps<TPayload> = {
  steps: readonly Step<TPayload>[]
  activeIndex: number
  mode: PresentationMode
  onGoToStep: (index: number) => void
  onNext: () => void
  onPrev: () => void
}

export function Footer<TPayload>({ steps, activeIndex, mode, onGoToStep, onNext, onPrev }: FooterProps<TPayload>) {
  const active = steps[activeIndex]
  if (!active || mode === 'present') return null

  return (
    <footer className="presentation-footer" data-presentation-footer>
      <p className="presentation-caption" data-presentation-caption>{active.caption}</p>
      <nav className="presentation-progress" aria-label="Presentation steps" data-presentation-progress>
        {steps.map((step, index) => (
          <button
            type="button"
            key={step.id}
            className={index === activeIndex ? 'is-active' : undefined}
            data-presentation-progress-item
            data-state-active={index === activeIndex ? 'true' : 'false'}
            aria-current={index === activeIndex ? 'step' : undefined}
            aria-label={`Step ${index + 1}: ${step.title}`}
            onClick={() => onGoToStep(index)}
          >
            {index + 1}
          </button>
        ))}
      </nav>
      <div className="presentation-step-controls" data-presentation-step-controls>
        <button type="button" aria-label="Previous step" onClick={onPrev} disabled={activeIndex === 0}>
          Previous
        </button>
        <button type="button" aria-label="Next step" onClick={onNext} disabled={activeIndex === steps.length - 1}>
          Next
        </button>
      </div>
    </footer>
  )
}
