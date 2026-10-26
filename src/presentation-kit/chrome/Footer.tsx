import type { PresentationMode, Step } from '../types'

type FooterProps<TPayload> = {
  mode: PresentationMode
  step: Step<TPayload>
  stepIndex: number
  steps: readonly Step<TPayload>[]
  onGoTo: (index: number) => void
  onNext: () => void
  onPrev: () => void
}

export function Footer<TPayload>({ mode, step, stepIndex, steps, onGoTo, onNext, onPrev }: FooterProps<TPayload>) {
  if (mode === 'present') return null

  return (
    <footer data-presentation-footer="true">
      <p data-presentation-caption="true">{step.caption}</p>
      <div aria-label="Presentation progress" data-presentation-progress="true">
        {steps.map((item, index) => {
          const active = index === stepIndex
          return (
            <button
              aria-current={active ? 'step' : undefined}
              aria-label={`Go to step ${index + 1}: ${item.title}`}
              data-presentation-progress-item="true"
              data-presentation-progress-active={active || undefined}
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
        <button aria-label="Previous step" data-presentation-prev="true" onClick={onPrev} type="button">Previous</button>
        <button aria-label="Next step" data-presentation-next="true" onClick={onNext} type="button">Next</button>
      </div>
    </footer>
  )
}
