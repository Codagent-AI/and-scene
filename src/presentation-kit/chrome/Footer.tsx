import type { Mode, OutlineEntry } from '../types.ts'
import { activate } from './activate.ts'

interface FooterProps {
  mode: Mode
  entries: OutlineEntry[]
  index: number
  onPrev: () => void
  onNext: () => void
  onGoto: (index: number) => void
}

export function Footer({ mode, entries, index, onPrev, onNext, onGoto }: FooterProps) {
  const active = entries[index].step
  const browse = mode === 'browse'
  return (
    <footer data-presentation-footer="" style={{ flex: '0 0 auto' }}>
      <h2 data-presentation-step-title="">{active.title}</h2>
      {browse ? (
        <>
          <p data-presentation-caption="">{active.caption}</p>
          <div
            data-presentation-controls=""
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <button
              type="button"
              data-presentation-prev=""
              aria-label="Previous step"
              disabled={index === 0}
              onClick={activate(onPrev)}
            >
              Previous
            </button>
            <nav data-presentation-progress="" aria-label="Step progress" style={{ display: 'flex' }}>
              {entries.map((entry) => {
                const isActive = entry.index === index
                return (
                  <button
                    key={entry.step.id}
                    type="button"
                    data-presentation-progress-dot=""
                    data-index={entry.index}
                    data-active={isActive ? 'true' : undefined}
                    aria-current={isActive ? 'step' : undefined}
                    aria-label={`Step ${entry.number}: ${entry.step.title}`}
                    onClick={activate(() => onGoto(entry.index))}
                  />
                )
              })}
            </nav>
            <button
              type="button"
              data-presentation-next=""
              aria-label="Next step"
              disabled={index === entries.length - 1}
              onClick={activate(onNext)}
            >
              Next
            </button>
          </div>
        </>
      ) : null}
    </footer>
  )
}
