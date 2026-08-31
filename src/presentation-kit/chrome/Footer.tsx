import type { Step } from '../types'

interface FooterProps<TPayload> {
  step: Step<TPayload>
  stepIndex: number
  steps: readonly Step<TPayload>[]
  goTo: (index: number) => void
  next: () => void
  previous: () => void
}

export function Footer<TPayload>({ step, stepIndex, steps, goTo, next, previous }: FooterProps<TPayload>) {
  return (
    <footer data-presentation-footer>
      <p data-presentation-caption>{step.caption}</p>
      <nav aria-label="Presentation progress" data-presentation-progress>
        {steps.map((item, index) => {
          const active = index === stepIndex
          return (
            <button
              key={item.id}
              type="button"
              aria-label={item.title}
              aria-current={active ? 'step' : undefined}
              data-presentation-progress-item
              data-presentation-active={active ? 'true' : 'false'}
              onClick={() => goTo(index)}
            />
          )
        })}
      </nav>
      <div data-presentation-controls>
        <button type="button" aria-label="Previous step" onClick={previous}>Previous</button>
        <button type="button" aria-label="Next step" onClick={next}>Next</button>
      </div>
    </footer>
  )
}
