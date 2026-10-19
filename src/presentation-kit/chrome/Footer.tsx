import { stepNumber } from '../eras'
import type { Mode, StepMeta } from '../types'

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
  if (mode === 'present') {
    return (
      <footer data-presentation-footer="">
        <p data-presentation-title="">{step.title}</p>
      </footer>
    )
  }
  const blurOnClick = (ev: { detail: number; currentTarget: HTMLElement }) => {
    if (ev.detail > 0) ev.currentTarget.blur()
  }
  return (
    <footer data-presentation-footer="">
      <p data-presentation-caption="">{step.caption}</p>
      <div data-presentation-controls="" style={{ display: 'flex', alignItems: 'center' }}>
        <button
          type="button"
          data-presentation-prev=""
          disabled={index === 0}
          onClick={(ev) => {
            onPrev()
            blurOnClick(ev)
          }}
        >
          Previous
        </button>
        <ol data-presentation-progress="" style={{ display: 'flex' }}>
          {steps.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                data-presentation-progress-item=""
                data-presentation-progress-index={i}
                data-presentation-active={i === index ? 'true' : undefined}
                aria-current={i === index ? 'step' : undefined}
                aria-label={`Step ${i + 1}: ${s.title}`}
                onClick={(ev) => {
                  onJump(i)
                  blurOnClick(ev)
                }}
              >
                {stepNumber(i, steps.length)}
              </button>
            </li>
          ))}
        </ol>
        <button
          type="button"
          data-presentation-next=""
          disabled={index === steps.length - 1}
          onClick={(ev) => {
            onNext()
            blurOnClick(ev)
          }}
        >
          Next
        </button>
      </div>
    </footer>
  )
}
