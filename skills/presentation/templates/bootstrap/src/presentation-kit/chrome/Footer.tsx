import { ATTRIBUTION_HEIGHT, STAGE_LAYOUT } from '../constants'
import type { PresentationMode, StepMeta } from '../types'

export interface FooterProps {
  mode: PresentationMode
  steps: readonly StepMeta[]
  index: number
  onPrev: () => void
  onNext: () => void
  onJump: (index: number) => void
}

const ONE_LINE = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } as const

/** Present mode: title only. Browse mode: title, caption, progress and prev/next. */
export function Footer({ mode, steps, index, onPrev, onNext, onJump }: FooterProps) {
  const step = steps[index]
  const browse = mode === 'browse'
  return (
    <footer
      data-presentation-footer
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: STAGE_LAYOUT[mode].bottom,
      }}
    >
      {/* In normal flow, so presentation-owned footer padding insets the content. */}
      <div style={{ height: `calc(100% - ${ATTRIBUTION_HEIGHT}px)`, overflow: 'auto' }}>
        <h2 data-presentation-title style={browse ? undefined : ONE_LINE}>
          {step.title}
        </h2>
        {browse ? (
          <>
            <p data-presentation-caption>{step.caption}</p>
            <div data-presentation-controls>
              <button type="button" data-presentation-prev disabled={index === 0} onClick={onPrev}>
                Previous
              </button>
              <div data-presentation-progress role="group" aria-label="Step progress">
                {steps.map((s, i) => {
                  const active = i === index
                  return (
                    <button
                      key={s.id}
                      type="button"
                      data-presentation-progress-item
                      data-presentation-active={active ? '' : undefined}
                      aria-current={active ? 'step' : undefined}
                      aria-label={`Step ${i + 1}: ${s.title}`}
                      onClick={() => onJump(i)}
                    >
                      {i + 1}
                    </button>
                  )
                })}
              </div>
              <button
                type="button"
                data-presentation-next
                disabled={index === steps.length - 1}
                onClick={onNext}
              >
                Next
              </button>
            </div>
          </>
        ) : null}
      </div>
    </footer>
  )
}
