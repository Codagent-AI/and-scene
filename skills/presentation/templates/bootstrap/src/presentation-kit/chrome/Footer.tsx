import type { HTMLAttributes } from 'react'
import type { Mode, Step } from '../types'
import { stepNumber } from './stepNumber'

export interface FooterProps<TPayload> extends Omit<HTMLAttributes<HTMLElement>, 'onSelect'> {
  mode: Mode
  steps: readonly Step<TPayload>[]
  index: number
  last: number
  onJump: (index: number) => void
  onPrev: () => void
  onNext: () => void
}

/**
 * Caption and title for the active step, progress indicators, and controls.
 * Present mode keeps only the marker and one-line title.
 */
export function Footer<TPayload>({ mode, steps, index, last, onJump, onPrev, onNext, style, ...rest }: FooterProps<TPayload>) {
  const step = steps[index]
  if (!step) return null
  return (
    <footer data-presentation-footer="" {...rest} style={{ display: 'flex', flexDirection: 'column', flex: '0 0 auto', ...style }}>
      <div data-presentation-heading="" style={{ display: 'flex', alignItems: 'baseline', minWidth: 0 }}>
        <span data-presentation-marker="">{stepNumber(index)}</span>
        <h2
          data-presentation-title=""
          style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: mode === 'present' ? 'nowrap' : 'normal' }}
        >
          {step.title}
        </h2>
      </div>
      {mode === 'browse' ? <p data-presentation-caption="">{step.caption}</p> : null}
      <nav aria-label="Steps" data-presentation-progress-list="" style={{ display: 'flex' }}>
        {steps.map((_, dot) => {
          const active = dot === index
          return (
            <button
              key={dot}
              type="button"
              data-presentation-progress=""
              aria-label={`Go to step ${stepNumber(dot)}`}
              {...(active ? { 'aria-current': 'step' as const, 'data-presentation-active': 'true' } : {})}
              onClick={() => onJump(dot)}
            />
          )
        })}
      </nav>
      {mode === 'browse' ? (
        <div data-presentation-controls="" style={{ display: 'flex' }}>
          <button type="button" data-presentation-control="prev" disabled={index === 0} onClick={onPrev}>
            Previous
          </button>
          <button type="button" data-presentation-control="next" disabled={index === last} onClick={onNext}>
            Next
          </button>
        </div>
      ) : null}
    </footer>
  )
}
