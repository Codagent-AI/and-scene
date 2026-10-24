import type { Mode } from '../types'

export interface FooterProps {
  steps: readonly { id: string; title: string; caption: string }[]
  index: number
  mode: Mode
  onPrev: () => void
  onNext: () => void
  onJump: (index: number) => void
}

export function Footer({ steps, index, mode, onPrev, onNext, onJump }: FooterProps) {
  const step = steps[index]
  if (!step) return null
  return (
    <footer data-presentation-footer="" data-presentation-chrome="">
      <h2 data-presentation-step-title="" style={{ margin: 0 }}>
        {step.title}
      </h2>
      {mode === 'browse' && (
        <>
          <p data-presentation-step-caption="">{step.caption}</p>
          <div data-presentation-controls="" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button type="button" data-presentation-prev="" onClick={onPrev} disabled={index === 0}>
              Previous
            </button>
            <ol data-presentation-progress="" style={{ display: 'flex', gap: 6, margin: 0, padding: 0, listStyle: 'none' }}>
              {steps.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    data-presentation-dot=""
                    data-presentation-active={String(i === index)}
                    aria-current={i === index ? 'step' : undefined}
                    aria-label={`Step ${i + 1}: ${s.title}`}
                    onClick={() => onJump(i)}
                  >
                    {i + 1}
                  </button>
                </li>
              ))}
            </ol>
            <button type="button" data-presentation-next="" onClick={onNext} disabled={index === steps.length - 1}>
              Next
            </button>
          </div>
        </>
      )}
    </footer>
  )
}
