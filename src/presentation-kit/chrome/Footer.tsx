import { STAGE_LAYOUT } from '../constants'
import type { Mode, StepMeta } from '../types'
import { activeProps } from './activeProps'

export interface FooterProps {
  mode: Mode
  steps: readonly StepMeta[]
  index: number
  onJump: (index: number) => void
  onPrev: () => void
  onNext: () => void
}

export function Footer({ mode, steps, index, onJump, onPrev, onNext }: FooterProps) {
  const step = steps[index]
  const present = mode === 'present'
  return (
    <footer
      data-presentation-footer=""
      data-presentation-chrome="footer"
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: present ? STAGE_LAYOUT.present.insetBottom : STAGE_LAYOUT.browse.insetBottom,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      {present ? (
        <p data-presentation-title="">{step.title}</p>
      ) : (
        <>
          <p data-presentation-caption="">{step.caption}</p>
          <div data-presentation-controls="" style={{ display: 'flex', alignItems: 'center' }}>
            <button type="button" data-presentation-prev="" aria-label="Previous step" disabled={index === 0} onClick={onPrev}>
              Prev
            </button>
            <ol data-presentation-progress="" data-presentation-chrome="dots" style={{ display: 'flex' }}>
              {steps.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    data-presentation-dot={s.id}
                    aria-label={`Go to step ${i + 1}: ${s.title}`}
                    onClick={() => onJump(i)}
                    {...activeProps(i === index)}
                  />
                </li>
              ))}
            </ol>
            <button type="button" data-presentation-next="" aria-label="Next step" disabled={index === steps.length - 1} onClick={onNext}>
              Next
            </button>
          </div>
        </>
      )}
    </footer>
  )
}
