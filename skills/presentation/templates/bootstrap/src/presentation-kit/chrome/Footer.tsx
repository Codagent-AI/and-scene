import { activeAttrs } from './active'
import type { HTMLAttributes } from 'react'
import type { StepMeta, Mode } from '../types'

export interface FooterProps extends HTMLAttributes<HTMLElement> {
  mode: Mode
  step: StepMeta
  steps: readonly StepMeta[]
  index: number
  onPrev: () => void
  onNext: () => void
  onJump: (index: number) => void
}

/** Present mode: marker-level title only. Browse mode adds caption, progress and prev/next. */
export function Footer({ mode, step, steps, index, onPrev, onNext, onJump, style, ...rest }: FooterProps) {
  const browse = mode === 'browse'
  return (
    <footer data-presentation-footer="" {...rest} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, ...style }}>
      <h2 data-presentation-title="">{step.title}</h2>
      {browse && <p data-presentation-caption="">{step.caption}</p>}
      {browse && (
        <div data-presentation-controls="" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button type="button" data-presentation-prev="" aria-label="Previous step" disabled={index === 0} onClick={onPrev}>
            Prev
          </button>
          <nav data-presentation-progress="" aria-label="Step progress" style={{ display: 'flex', alignItems: 'center' }}>
            {steps.map((s, i) => {
              const active = i === index
              return (
                <button
                  key={s.id}
                  type="button"
                  data-presentation-progress-item=""
                  {...activeAttrs(active)}
                  aria-label={`Step ${i + 1}: ${s.title}`}
                  onClick={() => onJump(i)}
                />
              )
            })}
          </nav>
          <button type="button" data-presentation-next="" aria-label="Next step" disabled={index === steps.length - 1} onClick={onNext}>
            Next
          </button>
        </div>
      )}
    </footer>
  )
}
