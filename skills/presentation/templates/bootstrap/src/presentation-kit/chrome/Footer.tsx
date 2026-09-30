import type { PresentationMode, Step } from '../types'

interface FooterProps<TPayload> {
  mode: PresentationMode
  title: string
  step: Step<TPayload>
  stepIndex: number
  steps: readonly Step<TPayload>[]
  onGoTo: (index: number) => void
  onNext: () => void
  onPrevious: () => void
}

export function Footer<TPayload>({
  mode,
  title,
  step,
  stepIndex,
  steps,
  onGoTo,
  onNext,
  onPrevious,
}: FooterProps<TPayload>) {
  if (mode === 'present') return <footer data-presentation-footer data-presentation-present-title>{title}</footer>

  return (
    <footer data-presentation-footer>
      <p data-presentation-caption>{step.caption}</p>
      <div data-presentation-progress-list>
        {steps.map((item, index) => {
          const active = index === stepIndex
          return (
            <button
              key={item.id}
              type="button"
              data-presentation-progress
              data-active={active ? 'true' : 'false'}
              aria-current={active ? 'step' : undefined}
              aria-label={`Go to step ${index + 1}: ${item.title}`}
              onClick={() => onGoTo(index)}
            >
              {index + 1}
            </button>
          )
        })}
      </div>
      <button type="button" data-presentation-prev onClick={onPrevious}>Previous</button>
      <button type="button" data-presentation-next onClick={onNext}>Next</button>
    </footer>
  )
}
