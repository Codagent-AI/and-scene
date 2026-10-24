import type { HTMLAttributes } from 'react'
import type { Mode, StepMeta } from '../types.ts'

export interface FooterProps extends HTMLAttributes<HTMLElement> {
  mode: Mode
  step: StepMeta
  steps: readonly StepMeta[]
  index: number
  height: number
  onJump: (index: number) => void
  onPrev: () => void
  onNext: () => void
}

/** Present mode: the one-line title. Browse mode: caption, progress, prev/next. */
export function Footer({ mode, step, steps, index, height, onJump, onPrev, onNext, style, ...rest }: FooterProps) {
  const frame = { flex: 'none', height, boxSizing: 'border-box', overflow: 'hidden', ...style } as const
  if (mode === 'present') {
    return (
      <footer data-presentation-footer="" {...rest} style={frame}>
        <h1 data-presentation-title="" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {step.title}
        </h1>
      </footer>
    )
  }
  return (
    <footer data-presentation-footer="" {...rest} style={frame}>
      <p data-presentation-caption="">{step.caption}</p>
      <nav aria-label="Progress" data-presentation-progress="">
        <ol>
          {steps.map((s, i) => {
            const active = i === index
            return (
              <li key={s.id}>
                <button
                  type="button"
                  data-presentation-progress-item=""
                  data-presentation-active={active ? 'true' : undefined}
                  aria-current={active ? 'step' : undefined}
                  aria-label={`Step ${i + 1}: ${s.title}`}
                  onClick={() => onJump(i)}
                />
              </li>
            )
          })}
        </ol>
      </nav>
      <div data-presentation-controls="">
        <button type="button" data-presentation-prev="" onClick={onPrev}>
          Previous
        </button>
        <button type="button" data-presentation-next="" onClick={onNext}>
          Next
        </button>
      </div>
    </footer>
  )
}
