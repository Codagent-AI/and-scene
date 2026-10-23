import { ChevronLeft, ChevronRight } from 'lucide-react'
import { activation } from './activation'
import type { Mode } from '../constants'
import type { Attribution, PresentationStep } from '../types'

interface FooterProps {
  mode: Mode
  steps: readonly PresentationStep[]
  index: number
  attribution: Attribution | false
  onGoTo: (index: number) => void
}

export function Footer({ mode, steps, index, attribution, onGoTo }: FooterProps) {
  const step = steps[index]
  return (
    <footer data-presentation-footer="">
      {mode === 'present' ? (
        <h1 data-presentation-title="">{step.title}</h1>
      ) : (
        <>
          <p data-presentation-caption="">{step.caption}</p>
          <div data-presentation-controls="">
            <button
              type="button"
              data-presentation-prev=""
              aria-label="Previous step"
              onClick={activation(() => onGoTo(index - 1))}
            >
              <ChevronLeft aria-hidden="true" />
            </button>
            <nav data-presentation-progress="" aria-label="Step progress">
              {steps.map((s, i) => {
                const active = i === index
                return (
                  <button
                    key={s.id}
                    type="button"
                    data-presentation-dot=""
                    data-presentation-active={active ? 'true' : 'false'}
                    aria-current={active ? 'step' : undefined}
                    aria-label={`Step ${i + 1}: ${s.title}`}
                    onClick={activation(() => onGoTo(i))}
                  />
                )
              })}
            </nav>
            <button
              type="button"
              data-presentation-next=""
              aria-label="Next step"
              onClick={activation(() => onGoTo(index + 1))}
            >
              <ChevronRight aria-hidden="true" />
            </button>
          </div>
        </>
      )}
      {attribution ? (
        <a
          data-presentation-attribution=""
          href={attribution.href}
          target="_blank"
          rel="noreferrer"
        >
          {attribution.label}
        </a>
      ) : null}
    </footer>
  )
}
