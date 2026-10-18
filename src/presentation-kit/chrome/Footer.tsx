import { STAGE_LAYOUT } from '../constants'
import type { AnyStep } from '../types'
import { stepNumber } from '../steps'
import { Toc } from './Toc'
import type { Era } from '../types'

export interface FooterProps {
  steps: readonly AnyStep[]
  index: number
  eras: readonly Era[]
  showToc: boolean
  onPrev: () => void
  onNext: () => void
  onJump: (index: number) => void
}

/** Browse-mode footer: caption, table of contents (wide viewports), progress, prev/next. */
export function Footer({ steps, index, eras, showToc, onPrev, onNext, onJump }: FooterProps) {
  const step = steps[index]
  return (
    <footer
      data-presentation-chrome="footer"
      style={{ maxHeight: STAGE_LAYOUT.browse.bottom, flex: 'none', overflowY: 'auto' }}
    >
      <p data-presentation-caption="">{step.caption}</p>
      {showToc && <Toc eras={eras} activeEra={step.era} onJump={onJump} />}
      <div data-presentation-chrome="controls" style={{ display: 'flex', alignItems: 'center' }}>
        <button
          type="button"
          data-presentation-nav="prev"
          aria-label="Previous step"
          disabled={index === 0}
          onClick={onPrev}
        >
          prev
        </button>
        <ol data-presentation-progress="" style={{ display: 'flex', listStyle: 'none' }}>
          {steps.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                data-presentation-progress-item=""
                data-presentation-active={i === index ? 'true' : undefined}
                aria-current={i === index ? 'step' : undefined}
                aria-label={`Step ${stepNumber(i)}: ${s.title}`}
                onClick={() => onJump(i)}
              />
            </li>
          ))}
        </ol>
        <button
          type="button"
          data-presentation-nav="next"
          aria-label="Next step"
          disabled={index === steps.length - 1}
          onClick={onNext}
        >
          next
        </button>
      </div>
    </footer>
  )
}
