import { ATTRIBUTION_RESERVE, STAGE_LAYOUT } from '../constants.ts'
import type { Mode, StepMeta } from '../types.ts'
import { Toc } from './Toc.tsx'

export interface FooterProps {
  steps: readonly StepMeta[]
  index: number
  mode: Mode
  wide: boolean
  onJump: (index: number) => void
  onNext: () => void
  onPrev: () => void
  onToggleMode: () => void
}

export function Footer({ steps, index, mode, wide, onJump, onNext, onPrev, onToggleMode }: FooterProps) {
  const step = steps[index]
  const browse = mode === 'browse'
  return (
    <footer
      data-presentation-footer=""
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: ATTRIBUTION_RESERVE,
        height: STAGE_LAYOUT[mode].bottom - ATTRIBUTION_RESERVE,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {browse && wide ? <Toc steps={steps} index={index} onJump={onJump} /> : null}
      <h1
        data-presentation-title=""
        style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
      >
        {step.title}
      </h1>
      {browse ? <p data-presentation-caption="">{step.caption}</p> : null}
      <div data-presentation-controls="" style={{ display: 'flex', alignItems: 'center' }}>
        {browse ? (
          <>
            <button
              type="button"
              data-presentation-prev=""
              aria-label="Previous step"
              disabled={index === 0}
              onClick={onPrev}
            >
              Previous
            </button>
            <div data-presentation-progress="" role="group" aria-label="Step progress" style={{ display: 'flex' }}>
              {steps.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  data-presentation-progress-item=""
                  data-presentation-active={i === index ? 'true' : undefined}
                  aria-current={i === index ? 'step' : undefined}
                  aria-label={`Step ${i + 1}: ${s.title}`}
                  onClick={() => onJump(i)}
                />
              ))}
            </div>
            <button
              type="button"
              data-presentation-next=""
              aria-label="Next step"
              disabled={index === steps.length - 1}
              onClick={onNext}
            >
              Next
            </button>
          </>
        ) : null}
        <button type="button" data-presentation-mode-toggle="" onClick={onToggleMode}>
          {browse ? 'Present' : 'Browse'}
        </button>
      </div>
    </footer>
  )
}
