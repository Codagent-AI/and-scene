import type { Mode, StepMeta } from '../types'
import { ReservedText } from './ReservedText'

export function Footer({ mode, steps, index, go, previous, next }: {
  mode: Mode
  steps: readonly StepMeta[]
  index: number
  go: (index: number) => void
  previous: () => void
  next: () => void
}) {
  const step = steps[index]
  return <footer data-presentation-footer="">
    {mode === 'present'
      ? <h1 data-presentation-step-title="" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {step.title}
        </h1>
      : <>
        <p data-presentation-caption="" aria-live="polite">
          <ReservedText text={step.caption} choices={steps.map(item => item.caption)} />
        </p>
        <nav aria-label="Step navigation" data-presentation-navigation="">
          <button type="button" data-presentation-previous="" disabled={index === 0} onClick={previous}>Previous</button>
          <div data-presentation-progress="">
            {steps.map((item, position) => <button type="button" key={item.id} onClick={() => go(position)}
              aria-label={`Step ${position + 1}: ${item.title}`} aria-current={position === index ? 'step' : undefined}
              data-presentation-progress-step="" data-presentation-active={position === index}>
              <span aria-hidden="true">{position + 1}</span>
            </button>)}
          </div>
          <button type="button" data-presentation-next="" disabled={index === steps.length - 1} onClick={next}>Next</button>
        </nav>
      </>}
  </footer>
}
