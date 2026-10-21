import type { Mode, StepMeta } from '../types'
import { Toc } from './Toc'

export interface FooterProps {
  mode: Mode
  steps: ReadonlyArray<StepMeta>
  index: number
  /** Whether the viewport is wide enough to show the table of contents. */
  wide: boolean
  onJump: (index: number) => void
  onPrev: () => void
  onNext: () => void
}

export function Footer({ mode, steps, index, wide, onJump, onPrev, onNext }: FooterProps) {
  const step = steps[index]
  const browse = mode === 'browse'
  return (
    <footer
      data-presentation-footer=""
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}
    >
      {browse && wide ? <Toc steps={steps} index={index} onJump={onJump} /> : null}
      {browse ? (
        <p data-presentation-caption="" style={{ whiteSpace: 'normal' }}>
          {step.caption}
        </p>
      ) : (
        <h1
          data-presentation-title=""
          style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {step.title}
        </h1>
      )}
      <nav data-presentation-progress="" aria-label="Progress">
        {steps.map((s, i) => {
          const isActive = i === index
          return (
            <button
              key={s.id}
              type="button"
              data-presentation-progress-dot=""
              data-presentation-active={isActive ? 'true' : undefined}
              aria-current={isActive ? 'step' : undefined}
              aria-label={`Step ${i + 1}: ${s.title}`}
              onClick={() => onJump(i)}
            />
          )
        })}
      </nav>
      {browse ? (
        <div data-presentation-controls="">
          <button type="button" data-presentation-prev="" disabled={index === 0} onClick={onPrev}>
            Previous
          </button>
          <button
            type="button"
            data-presentation-next=""
            disabled={index === steps.length - 1}
            onClick={onNext}
          >
            Next
          </button>
        </div>
      ) : null}
    </footer>
  )
}
