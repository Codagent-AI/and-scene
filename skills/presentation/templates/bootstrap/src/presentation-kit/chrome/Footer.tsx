import { STAGE_LAYOUT } from '../constants.ts'
import type { StepMeta, Mode } from '../types.ts'

export interface FooterProps {
  mode: Mode
  steps: readonly StepMeta[]
  index: number
  onPrev: () => void
  onNext: () => void
  onJump: (index: number) => void
}

type ClickEvent = { detail: number; currentTarget: { blur: () => void } }

/** After a pointer click, hand the arrow keys back to the deck. */
function releaseFocus(event: ClickEvent) {
  if (event.detail > 0) event.currentTarget.blur()
}

export function Footer({ mode, steps, index, onPrev, onNext, onJump }: FooterProps) {
  const active = steps[index]
  const style = { position: 'absolute', left: 0, right: 0, bottom: 0, height: STAGE_LAYOUT[mode].bottom } as const
  if (mode === 'present') {
    return (
      <footer data-presentation-footer="" style={style}>
        <h1
          data-presentation-title=""
          style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {active.title}
        </h1>
      </footer>
    )
  }
  return (
    <footer data-presentation-footer="" style={style}>
      <p data-presentation-caption="">{active.caption}</p>
      <nav data-presentation-progress="" aria-label="Step progress">
        {steps.map((step, i) => (
          <button
            key={step.id}
            type="button"
            data-presentation-progress-dot=""
            data-presentation-active={i === index ? 'true' : undefined}
            aria-current={i === index ? 'step' : undefined}
            aria-label={`Step ${i + 1}: ${step.title}`}
            onClick={(event) => {
              onJump(i)
              releaseFocus(event)
            }}
          />
        ))}
      </nav>
      <div data-presentation-controls="">
        <button
          type="button"
          data-presentation-prev=""
          disabled={index === 0}
          onClick={(event) => {
            onPrev()
            releaseFocus(event)
          }}
        >
          Previous
        </button>
        <button
          type="button"
          data-presentation-next=""
          disabled={index === steps.length - 1}
          onClick={(event) => {
            onNext()
            releaseFocus(event)
          }}
        >
          Next
        </button>
      </div>
    </footer>
  )
}
