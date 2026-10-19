import { ATTRIBUTION_STRIP, type PresentationMode } from '../constants'
import type { StepMeta } from '../types'

export interface FooterProps {
  mode: PresentationMode
  steps: readonly StepMeta[]
  index: number
  onGoTo: (index: number) => void
  onPrev: () => void
  onNext: () => void
}

export function Footer({ mode, steps, index, onGoTo, onPrev, onNext }: FooterProps) {
  const active = steps[index]
  return (
    <footer
      data-presentation-footer=""
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: ATTRIBUTION_STRIP,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        overflow: 'hidden',
      }}
    >
      {mode === 'present' ? (
        <p
          data-presentation-title=""
          style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {active?.title}
        </p>
      ) : (
        <p data-presentation-caption="">{active?.caption}</p>
      )}
      <nav
        data-presentation-controls=""
        aria-label="Step navigation"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}
      >
        {mode === 'browse' ? (
          <button type="button" data-presentation-prev="" onClick={onPrev} disabled={index <= 0}>
            Previous
          </button>
        ) : null}
        <ol
          data-presentation-progress=""
          style={{ display: 'flex', alignItems: 'center', listStyle: 'none' }}
        >
          {steps.map((step, i) => (
            <li key={step.id}>
              <button
                type="button"
                data-presentation-progress-dot=""
                aria-label={`Go to step ${i + 1}: ${step.title}`}
                aria-current={i === index ? 'step' : undefined}
                data-presentation-active={i === index ? 'true' : undefined}
                onClick={() => onGoTo(i)}
              />
            </li>
          ))}
        </ol>
        {mode === 'browse' ? (
          <button
            type="button"
            data-presentation-next=""
            onClick={onNext}
            disabled={index >= steps.length - 1}
          >
            Next
          </button>
        ) : null}
      </nav>
    </footer>
  )
}
