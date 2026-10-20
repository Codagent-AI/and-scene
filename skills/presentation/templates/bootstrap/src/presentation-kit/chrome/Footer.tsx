import { STAGE_LAYOUT } from '../constants.ts'
import type { Mode, StepMeta } from '../types.ts'
import { jump } from './jump.ts'

export interface FooterProps {
  steps: readonly StepMeta[]
  index: number
  mode: Mode
  onJump: (index: number) => void
  onPrev: () => void
  onNext: () => void
}

export function Footer({ steps, index, mode, onJump, onPrev, onNext }: FooterProps) {
  const step = steps[index]
  return (
    <footer
      data-presentation-footer=""
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: STAGE_LAYOUT[mode].bottom }}
    >
      <h2 data-presentation-title="">{step.title}</h2>
      {mode === 'browse' && (
        <>
          <p data-presentation-caption="">{step.caption}</p>
          <ol data-presentation-progress="">
            {steps.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  data-presentation-progress-dot=""
                  aria-label={`Step ${i + 1}: ${s.title}`}
                  aria-current={i === index ? 'step' : undefined}
                  data-presentation-active={i === index ? 'true' : undefined}
                  onClick={jump(onJump, i)}
                />
              </li>
            ))}
          </ol>
          <div data-presentation-controls="">
            <button type="button" data-presentation-prev="" disabled={index === 0} onClick={onPrev}>
              Previous
            </button>
            <button type="button" data-presentation-next="" disabled={index === steps.length - 1} onClick={onNext}>
              Next
            </button>
          </div>
        </>
      )}
    </footer>
  )
}
