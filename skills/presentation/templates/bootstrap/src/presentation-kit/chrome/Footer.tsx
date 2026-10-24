import type { HTMLAttributes } from 'react'
import { ATTRIBUTION_RESERVE, type Mode } from '../constants'
import { stepMarker } from '../steps'
import type { StepMeta } from '../types'
import { Progress } from './Progress'

export interface FooterProps extends HTMLAttributes<HTMLElement> {
  mode: Mode
  step: StepMeta
  index: number
  count: number
  titles: string[]
  onJump: (index: number) => void
  onPrev: () => void
  onNext: () => void
}

/** Present mode: marker + one-line title. Browse mode: title, caption, progress, prev/next. */
export function Footer({ mode, step, index, count, titles, onJump, onPrev, onNext, style, ...rest }: FooterProps) {
  const marker = <span data-presentation-marker="">{stepMarker(index, count)}</span>
  const title = <span data-presentation-step-title="">{step.title}</span>
  if (mode === 'present') {
    return (
      <footer
        {...rest}
        data-presentation-chrome="footer"
        style={{ position: 'absolute', left: 0, right: 0, bottom: ATTRIBUTION_RESERVE, display: 'flex', alignItems: 'baseline', ...style }}
      >
        {marker}
        <div data-presentation-title-line="" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
          {title}
        </div>
      </footer>
    )
  }
  return (
    <footer
      {...rest}
      data-presentation-chrome="footer"
      style={{ position: 'absolute', left: 0, right: 0, bottom: ATTRIBUTION_RESERVE, display: 'flex', flexDirection: 'column', ...style }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline' }}>
        {marker}
        {title}
      </div>
      <p data-presentation-caption="" style={{ whiteSpace: 'normal' }}>
        {step.caption}
      </p>
      <nav data-presentation-chrome="nav" aria-label="Step navigation" style={{ display: 'flex', alignItems: 'center' }}>
        <button type="button" data-presentation-prev="" aria-label="Previous step" disabled={index === 0} onClick={onPrev}>
          ‹
        </button>
        <Progress titles={titles} index={index} onJump={onJump} />
        <button type="button" data-presentation-next="" aria-label="Next step" disabled={index === count - 1} onClick={onNext}>
          ›
        </button>
      </nav>
    </footer>
  )
}
