import { ChevronLeft, ChevronRight } from 'lucide-react'
import { stepMarker } from '../nav'
import type { AnyStep, PresentationMode } from '../types'

export interface FooterProps {
  steps: readonly AnyStep[]
  index: number
  mode: PresentationMode
  onGoTo: (index: number) => void
  onPrev: () => void
  onNext: () => void
}

export function Footer({ steps, index, mode, onGoTo, onPrev, onNext }: FooterProps) {
  const step = steps[index]
  const marker = stepMarker(index, steps.length)
  return (
    <footer
      data-presentation-footer=""
      style={{ position: 'absolute', left: 0, right: 0, bottom: 32 }}
    >
      <div data-presentation-marker="">{marker}</div>
      {mode === 'present' ? (
        <h1 data-presentation-title="">{step.title}</h1>
      ) : (
        <>
          <p data-presentation-caption="">{step.caption}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button type="button" data-presentation-prev="" aria-label="Previous step" disabled={index === 0} onClick={onPrev}>
              <ChevronLeft aria-hidden="true" />
            </button>
            <div data-presentation-progress="" style={{ display: 'flex', alignItems: 'center' }}>
              {steps.map((s, i) => {
                const active = i === index
                return (
                  <button
                    key={`${i}:${s.id}`}
                    type="button"
                    data-presentation-progress-item={i}
                    data-presentation-active={active ? 'true' : undefined}
                    aria-current={active ? 'step' : undefined}
                    aria-label={`Step ${i + 1}: ${s.title}`}
                    onClick={() => onGoTo(i)}
                  />
                )
              })}
            </div>
            <button type="button" data-presentation-next="" aria-label="Next step" disabled={index === steps.length - 1} onClick={onNext}>
              <ChevronRight aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </footer>
  )
}
