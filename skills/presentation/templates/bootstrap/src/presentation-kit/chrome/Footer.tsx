import type { PresentationMode, StepMeta } from '../types'

interface FooterProps {
  mode: PresentationMode
  steps: readonly StepMeta[]
  index: number
  jump: (index: number) => void
  next: () => void
  previous: () => void
}

export function Footer({ mode, steps, index, jump, next, previous }: FooterProps) {
  const step = steps[index]
  return (
    <footer data-presentation-footer="">
      <div data-presentation-narration="">
        <h2 data-presentation-step-title="" style={mode === 'present'
          ? { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
          : undefined}>
          {step.title}
        </h2>
        {mode === 'browse' && <p data-presentation-caption="">{step.caption}</p>}
      </div>
      {mode === 'browse' && (
        <nav data-presentation-controls="" aria-label="Step navigation">
          <button type="button" data-presentation-prev="" onClick={previous} disabled={index === 0}>
            Previous
          </button>
          <div data-presentation-progress="">
            {steps.map(({ id, title }, position) => (
              <button
                key={id}
                type="button"
                data-presentation-progress-item=""
                data-presentation-active={index === position ? 'true' : undefined}
                aria-current={index === position ? 'step' : undefined}
                aria-label={`Step ${position + 1}: ${title}`}
                onClick={() => jump(position)}
              >
                {position + 1}
              </button>
            ))}
          </div>
          <button type="button" data-presentation-next="" onClick={next} disabled={index === steps.length - 1}>
            Next
          </button>
        </nav>
      )}
    </footer>
  )
}
