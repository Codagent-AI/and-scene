import { ATTRIBUTION_HEIGHT, STAGE_LAYOUT, type Mode } from '../constants'
import type { StepMeta } from '../types'

interface FooterProps {
  mode: Mode
  steps: readonly StepMeta[]
  index: number
  onGoTo: (index: number) => void
  onPrev: () => void
  onNext: () => void
}

export function Footer({ mode, steps, index, onGoTo, onPrev, onNext }: FooterProps) {
  const step = steps[index]
  const browse = mode === 'browse'
  return (
    <footer
      data-presentation-footer=""
      data-presentation-chrome=""
      style={{ height: STAGE_LAYOUT[mode].bottom, flex: 'none', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      {browse ? (
        <>
          <p data-presentation-caption="" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            {step.caption}
          </p>
          <div style={{ height: 36, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <nav data-presentation-progress="" aria-label="Step progress" style={{ display: 'flex', alignItems: 'center' }}>
              {steps.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  data-presentation-progress-item=""
                  data-presentation-active={i === index ? 'true' : undefined}
                  aria-current={i === index ? 'step' : undefined}
                  aria-label={`Step ${i + 1}: ${s.title}`}
                  onClick={() => onGoTo(i)}
                />
              ))}
            </nav>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button type="button" data-presentation-prev="" onClick={onPrev} disabled={index === 0}>
                Previous
              </button>
              <button type="button" data-presentation-next="" onClick={onNext} disabled={index === steps.length - 1}>
                Next
              </button>
            </div>
          </div>
        </>
      ) : (
        <p
          data-presentation-title=""
          style={{ flex: 1, minHeight: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
        >
          {step.title}
        </p>
      )}
      <div style={{ height: ATTRIBUTION_HEIGHT, flex: 'none' }} />
    </footer>
  )
}
