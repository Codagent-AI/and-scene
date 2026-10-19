import type { CSSProperties } from 'react'
import { STAGE_LAYOUT } from '../constants'
import type { PresentationMode, Step } from '../types'

export interface FooterProps {
  mode: PresentationMode
  steps: ReadonlyArray<Pick<Step<unknown>, 'id' | 'title' | 'caption' | 'era'>>
  index: number
  onPrev: () => void
  onNext: () => void
  onGoTo: (index: number) => void
  className?: string
  style?: CSSProperties
}

export function Footer({ mode, steps, index, onPrev, onNext, onGoTo, className, style, ...rest }: FooterProps) {
  const step = steps[index]
  const last = steps.length - 1
  return (
    <footer
      {...rest}
      data-presentation-footer=""
      className={className}
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: STAGE_LAYOUT[mode].footer,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        ...style,
      }}
    >
      <p data-presentation-step-title="">{step.title}</p>
      {mode === 'browse' ? (
        <>
          <p data-presentation-step-caption="">{step.caption}</p>
          <div data-presentation-controls="">
            <button type="button" data-presentation-prev="" disabled={index === 0} onClick={onPrev}>
              Previous
            </button>
            <nav aria-label="Progress" data-presentation-progress="">
              {steps.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  data-presentation-progress-dot=""
                  data-presentation-active={i === index ? 'true' : undefined}
                  aria-current={i === index ? 'step' : undefined}
                  aria-label={`Step ${i + 1}: ${s.title}`}
                  onClick={() => onGoTo(i)}
                />
              ))}
            </nav>
            <button type="button" data-presentation-next="" disabled={index === last} onClick={onNext}>
              Next
            </button>
          </div>
        </>
      ) : null}
    </footer>
  )
}
