import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Step } from '../types.ts'
import { releaseFocusOnPointer } from './focus.ts'

interface FooterProps {
  steps: ReadonlyArray<Pick<Step<unknown>, 'title'>>
  index: number
  onGoTo: (index: number) => void
  onPrev: () => void
  onNext: () => void
}

export function Footer({ steps, index, onGoTo, onPrev, onNext }: FooterProps) {
  const last = steps.length - 1
  return (
    <footer
      data-presentation-footer=""
      data-presentation-chrome=""
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}
    >
      <button
        type="button"
        data-presentation-prev=""
        aria-label="Previous step"
        disabled={index <= 0}
        onClick={(event) => {
          onPrev()
          releaseFocusOnPointer(event)
        }}
      >
        <ChevronLeft aria-hidden="true" />
      </button>
      <ol data-presentation-progress="" style={{ display: 'flex', listStyle: 'none', margin: 0, padding: 0 }}>
        {steps.map((step, i) => {
          const active = i === index
          return (
            <li key={i}>
              <button
                type="button"
                data-presentation-progress-item=""
                data-presentation-chrome-item=""
                data-presentation-active={active ? 'true' : undefined}
                aria-current={active ? 'step' : undefined}
                aria-label={`Step ${i + 1}: ${step.title}`}
                onClick={(event) => {
                  onGoTo(i)
                  releaseFocusOnPointer(event)
                }}
              />
            </li>
          )
        })}
      </ol>
      <button
        type="button"
        data-presentation-next=""
        aria-label="Next step"
        disabled={index >= last}
        onClick={(event) => {
          onNext()
          releaseFocusOnPointer(event)
        }}
      >
        <ChevronRight aria-hidden="true" />
      </button>
    </footer>
  )
}
