import type { PresentationMode } from '../constants'
import type { StepMeta } from '../types'

export interface FooterProps {
  step: StepMeta
  index: number
  count: number
  mode: PresentationMode
  onPrev: () => void
  onNext: () => void
  onJump: (index: number) => void
}

export function Footer({ step, index, count, mode, onPrev, onNext, onJump }: FooterProps) {
  const browse = mode === 'browse'
  return (
    <footer data-presentation-footer="" style={{ display: 'flex', alignItems: 'center' }}>
      {browse ? (
        <p data-presentation-caption="" style={{ margin: 0 }}>{step.caption}</p>
      ) : (
        <h1 data-presentation-title="" style={{ margin: 0 }}>{step.title}</h1>
      )}
      <ol data-presentation-progress="" style={{ display: 'flex', listStyle: 'none', margin: 0, padding: 0 }}>
        {Array.from({ length: count }, (_, i) => (
          <li key={i}>
            <button
              type="button"
              data-presentation-progress-dot=""
              data-presentation-active={i === index ? '' : undefined}
              aria-current={i === index ? 'step' : undefined}
              aria-label={`Go to step ${i + 1}`}
              onClick={() => onJump(i)}
            />
          </li>
        ))}
      </ol>
      {browse ? (
        <div data-presentation-controls="">
          <button type="button" data-presentation-prev="" disabled={index === 0} onClick={onPrev}>
            Previous
          </button>
          <button type="button" data-presentation-next="" disabled={index === count - 1} onClick={onNext}>
            Next
          </button>
        </div>
      ) : null}
    </footer>
  )
}
