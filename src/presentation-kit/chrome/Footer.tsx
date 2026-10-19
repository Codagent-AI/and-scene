import type { CSSProperties, ReactNode } from 'react'
import type { Mode, StepMeta } from '../types'
import { stepNumber } from '../eras'
import { dataHooks, type DataHooks } from '../nodes/geometry'

interface FooterProps extends DataHooks {
  className?: string
  style?: CSSProperties
  mode: Mode
  steps: readonly StepMeta[]
  index: number
  attribution: ReactNode
  onGoTo: (index: number) => void
  onPrev: () => void
  onNext: () => void
}

export function Footer({
  mode,
  steps,
  index,
  attribution,
  onGoTo,
  onPrev,
  onNext,
  className,
  style,
  ...hooks
}: FooterProps) {
  const step = steps[index]
  const last = steps.length - 1
  return (
    <footer {...dataHooks(hooks)} data-presentation-footer="" className={className} style={style}>
      <h2 data-presentation-title="">{step.title}</h2>
      {mode === 'browse' ? (
        <>
          <p data-presentation-caption="">{step.caption}</p>
          <nav data-presentation-progress="" aria-label="Step progress">
            {steps.map((s, i) => (
              <button
                key={s.id}
                type="button"
                data-presentation-progress-item=""
                data-presentation-active={i === index ? 'true' : undefined}
                aria-current={i === index ? 'step' : undefined}
                aria-label={`Step ${stepNumber(i)}: ${s.title}`}
                onClick={() => onGoTo(i)}
              />
            ))}
          </nav>
          <div data-presentation-controls="">
            <button type="button" data-presentation-prev="" disabled={index === 0} onClick={onPrev}>
              Previous
            </button>
            <button type="button" data-presentation-next="" disabled={index === last} onClick={onNext}>
              Next
            </button>
          </div>
        </>
      ) : null}
      {attribution}
    </footer>
  )
}
