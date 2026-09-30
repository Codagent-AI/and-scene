import type { PresentationMode, Step } from '../types'

interface FooterProps<TPayload> {
  mode: PresentationMode
  step: Step<TPayload>
  stepIndex: number
  steps: readonly Step<TPayload>[]
  onPrevious: () => void
  onNext: () => void
  onGoTo: (index: number) => void
}

export function Footer<TPayload>({
  mode,
  step,
  stepIndex,
  steps,
  onPrevious,
  onNext,
  onGoTo,
}: FooterProps<TPayload>) {
  if (mode === 'present') {
    return <footer data-presentation-footer="true" data-presentation-title="true">{step.title}</footer>
  }

  return (
    <footer
      data-presentation-footer="true"
      data-step-count={steps.length}
      data-step-index={stepIndex}
    >
      <p data-presentation-caption="true">{step.caption}</p>
      <div aria-label="Presentation progress" data-presentation-progress="true">
        {steps.map((item, index) => {
          const active = index === stepIndex
          return (
            <button
              aria-current={active ? 'step' : undefined}
              aria-label={`Go to step ${index + 1}: ${item.title}`}
              data-presentation-progress-active={active ? 'true' : undefined}
              data-presentation-step-id={item.id}
              key={item.id}
              onClick={() => onGoTo(index)}
              type="button"
            >
              {index + 1}
            </button>
          )
        })}
      </div>
      <div data-presentation-controls="true">
        <button disabled={stepIndex === 0} onClick={onPrevious} type="button">Previous</button>
        <button disabled={stepIndex === steps.length - 1} onClick={onNext} type="button">Next</button>
      </div>
    </footer>
  )
}
