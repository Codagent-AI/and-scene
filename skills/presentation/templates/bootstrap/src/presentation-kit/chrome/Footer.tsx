import type { PresentationMode, Step } from '../types'

interface FooterProps<TPayload> {
  mode: PresentationMode
  step: Step<TPayload>
  stepIndex: number
  steps: readonly Step<TPayload>[]
  next: () => void
  previous: () => void
  goTo: (index: number) => void
}

export function Footer<TPayload>({
  mode,
  step,
  stepIndex,
  steps,
  next,
  previous,
  goTo,
}: FooterProps<TPayload>) {
  if (mode === 'present') return <footer data-presentation-footer="true" />

  return (
    <footer data-presentation-footer="true">
      <h2 data-presentation-step-title="true">{step.title}</h2>
      <p data-presentation-caption="true">{step.caption}</p>
      <nav aria-label="Presentation progress" data-presentation-progress="true">
        {steps.map((candidate, index) => {
          const active = index === stepIndex
          return (
            <button
              type="button"
              key={candidate.id}
              onClick={() => goTo(index)}
              aria-label={`Step ${index + 1}: ${candidate.title}`}
              aria-current={active ? 'step' : undefined}
              data-presentation-progress-active={active ? 'true' : 'false'}
            />
          )
        })}
      </nav>
      <div data-presentation-step-controls="true">
        <button type="button" onClick={previous} disabled={stepIndex === 0}>Previous</button>
        <button type="button" onClick={next} disabled={stepIndex === steps.length - 1}>Next</button>
      </div>
    </footer>
  )
}
