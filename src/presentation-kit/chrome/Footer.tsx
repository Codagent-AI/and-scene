import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Mode, StepMeta } from '../types.ts'
import type { SlotProps } from './slots.ts'

export interface FooterProps {
  steps: readonly StepMeta[]
  index: number
  mode: Mode
  onJump: (index: number) => void
  onPrev: () => void
  onNext: () => void
  slot?: SlotProps
  progressSlot?: SlotProps
  prevSlot?: SlotProps
  nextSlot?: SlotProps
}

/** Present mode: the one-line title. Browse mode: caption, progress and prev/next. */
export function Footer({ steps, index, mode, onJump, onPrev, onNext, slot, progressSlot, prevSlot, nextSlot }: FooterProps) {
  const step = steps[index]
  if (mode === 'present') {
    return (
      <footer style={{ flex: '0 0 auto' }} {...slot} data-presentation-footer="">
        <h1 data-presentation-title="" style={{ whiteSpace: 'nowrap' }}>
          {step.title}
        </h1>
      </footer>
    )
  }
  return (
    <footer style={{ flex: '0 0 auto' }} {...slot} data-presentation-footer="">
      <p data-presentation-caption="">{step.caption}</p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} data-presentation-controls="">
        <button
          type="button"
          aria-label="Previous step"
          disabled={index <= 0}
          onClick={onPrev}
          {...prevSlot}
          data-presentation-prev=""
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        <nav aria-label="Step progress" style={{ display: 'flex', alignItems: 'center' }} {...progressSlot} data-presentation-progress="">
          {steps.map((s, i) => {
            const active = i === index
            return (
              <button
                key={s.id}
                type="button"
                aria-label={`Step ${i + 1}: ${s.title}`}
                aria-current={active ? 'step' : undefined}
                onClick={() => onJump(i)}
                data-presentation-progress-item=""
                data-presentation-active={active ? '' : undefined}
              />
            )
          })}
        </nav>
        <button
          type="button"
          aria-label="Next step"
          disabled={index >= steps.length - 1}
          onClick={onNext}
          {...nextSlot}
          data-presentation-next=""
        >
          <ChevronRight aria-hidden="true" />
        </button>
      </div>
    </footer>
  )
}
