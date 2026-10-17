import type { Mode, StepMeta } from '../types'
import { STAGE_LAYOUT } from '../constants'
import type { EraEntry } from '../steps'
import { Toc } from './Toc'

export interface FooterProps {
  mode: Mode
  steps: readonly StepMeta[]
  eras: readonly EraEntry[]
  index: number
  showToc: boolean
  onPrev: () => void
  onNext: () => void
  onJump: (stepIndex: number) => void
}

export function Footer({ mode, steps, eras, index, showToc, onPrev, onNext, onJump }: FooterProps) {
  const step = steps[index]
  const browse = mode === 'browse'
  return (
    <footer
      data-presentation-footer=""
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        // Reserved stage space is a floor, not a clip: wrapped titles/captions at narrow widths grow upward.
        minHeight: STAGE_LAYOUT[mode].bottom,
        padding: '0 24px 36px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        gap: 8,
      }}
    >
      <h2 data-presentation-step-title="" style={{ margin: 0 }}>{step.title}</h2>
      {browse && (
        <>
          <p data-presentation-caption="" style={{ margin: 0 }}>{step.caption}</p>
          {showToc && <Toc entries={eras} index={index} onJump={onJump} />}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button type="button" data-presentation-prev="" onClick={onPrev} disabled={index === 0} aria-label="Previous step">
              ←
            </button>
            <nav data-presentation-progress="" aria-label="Step progress" style={{ display: 'flex', gap: 6 }}>
              {steps.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  data-presentation-dot=""
                  data-presentation-active={i === index}
                  aria-current={i === index ? 'step' : undefined}
                  aria-label={`Step ${i + 1}: ${s.title}`}
                  onClick={() => onJump(i)}
                />
              ))}
            </nav>
            <button type="button" data-presentation-next="" onClick={onNext} disabled={index === steps.length - 1} aria-label="Next step">
              →
            </button>
          </div>
        </>
      )}
    </footer>
  )
}
