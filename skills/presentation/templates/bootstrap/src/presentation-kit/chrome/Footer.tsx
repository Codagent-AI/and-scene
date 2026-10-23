import { STAGE_LAYOUT } from '../constants.ts'
import { activeProps } from './activeProps.ts'
import type { Mode, StepMeta } from '../types.ts'

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
  return (
    <footer
      data-presentation-footer=""
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: STAGE_LAYOUT[mode].bottom,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <h2 data-presentation-title="">{step.title}</h2>
      {mode === 'browse' && (
        <>
          <p data-presentation-caption="" data-presentation-era={step.era}>
            {step.caption}
          </p>
          <div data-presentation-controls="" style={{ display: 'flex', alignItems: 'center' }}>
            <button type="button" data-presentation-prev="" onClick={onPrev} disabled={index === 0}>
              Previous
            </button>
            <nav data-presentation-progress="" aria-label="Steps" style={{ display: 'flex' }}>
              {steps.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  data-presentation-progress-item=""
                  aria-label={`Step ${i + 1}: ${s.title}`}
                  onClick={() => onGoTo(i)}
                  {...activeProps(i === index, 'step')}
                />
              ))}
            </nav>
            <button
              type="button"
              data-presentation-next=""
              onClick={onNext}
              disabled={index === steps.length - 1}
            >
              Next
            </button>
          </div>
        </>
      )}
    </footer>
  )
}
