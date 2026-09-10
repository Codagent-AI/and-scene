import type { Step } from '../types'

interface FooterProps<TPayload> {
  steps: readonly Step<TPayload>[]
  index: number
  onGoTo: (index: number) => void
  onNext: () => void
  onPrev: () => void
}

export function Footer<TPayload>({ steps, index, onGoTo, onNext, onPrev }: FooterProps<TPayload>) {
  const activeStep = steps[index]
  return <footer className="presentation-footer" data-presentation-footer>
    <p data-presentation-caption>{activeStep.caption}</p>
    <div data-presentation-progress aria-label="Step progress">
      {steps.map((step, stepIndex) => {
        const active = stepIndex === index
        return <button key={step.id} type="button" aria-label={`Go to step ${stepIndex + 1}`} aria-current={active ? 'step' : undefined} data-presentation-progress-item data-presentation-active={active || undefined} onClick={() => onGoTo(stepIndex)}>{stepIndex + 1}</button>
      })}
    </div>
    <div data-presentation-controls>
      <button type="button" aria-label="Previous step" onClick={onPrev} disabled={index === 0} data-presentation-prev>Previous</button>
      <button type="button" aria-label="Next step" onClick={onNext} disabled={index === steps.length - 1} data-presentation-next>Next</button>
    </div>
  </footer>
}
