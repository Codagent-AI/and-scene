import { STAGE_LAYOUT, type Mode } from '../constants'
import type { StepMeta } from '../types'

export interface FooterProps {
  steps: readonly StepMeta[]
  index: number
  mode: Mode
  onGoTo: (index: number) => void
  onPrev: () => void
  onNext: () => void
}

export function Footer({ steps, index, mode, onGoTo, onPrev, onNext }: FooterProps) {
  const step = steps[index]
  const box = {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: STAGE_LAYOUT[mode].bottom,
    boxSizing: 'border-box',
    paddingInline: STAGE_LAYOUT[mode].side,
    overflow: 'hidden',
  } as const
  if (mode === 'present') {
    return (
      <footer data-presentation-footer="" style={box}>
        <p data-presentation-title="">{step?.title}</p>
      </footer>
    )
  }
  return (
    <footer data-presentation-footer="" style={box}>
      <p data-presentation-caption="">{step?.caption}</p>
      <div data-presentation-controls="" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button type="button" data-presentation-prev="" onClick={onPrev} disabled={index === 0} aria-label="Previous step">
          Prev
        </button>
        <nav data-presentation-progress-list="" aria-label="Progress" style={{ display: 'flex', gap: 6 }}>
          {steps.map((s, i) => (
            <button
              key={s.id}
              type="button"
              data-presentation-progress=""
              data-presentation-active={i === index ? 'true' : undefined}
              aria-current={i === index ? 'step' : undefined}
              aria-label={`Step ${i + 1}: ${s.title}`}
              onClick={() => onGoTo(i)}
            />
          ))}
        </nav>
        <button type="button" data-presentation-next="" onClick={onNext} disabled={index === steps.length - 1} aria-label="Next step">
          Next
        </button>
      </div>
    </footer>
  )
}
