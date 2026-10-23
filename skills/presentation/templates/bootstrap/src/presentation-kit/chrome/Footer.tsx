import type { Mode } from '../types'
import { controlsStyle, footerStyle, progressStyle } from '../layout'

export interface FooterStep {
  id: string
  era: string
  title: string
  caption: string
}

export interface FooterProps {
  steps: readonly FooterStep[]
  index: number
  mode: Mode
  onGoTo: (index: number) => void
  onPrev: () => void
  onNext: () => void
}

/**
 * Bottom chrome. Present mode shows only the one-line title. Browse mode adds
 * the caption, prev/next controls, and progress indicators.
 */
export function Footer({ steps, index, mode, onGoTo, onPrev, onNext }: FooterProps) {
  const step = steps[index]
  const last = steps.length - 1
  return (
    <footer data-presentation-footer="" style={footerStyle}>
      <p data-presentation-step-title="">{step?.title}</p>
      {mode === 'browse' ? (
        <>
          <p data-presentation-caption="">{step?.caption}</p>
          <div style={controlsStyle} data-presentation-controls="">
            <button type="button" data-presentation-prev="" disabled={index === 0} onClick={onPrev}>
              Previous
            </button>
            <nav aria-label="Steps">
              <ol data-presentation-progress-list="" style={progressStyle}>
                {steps.map((item, i) => {
                  const active = i === index
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        data-presentation-progress=""
                        data-presentation-active={active ? 'true' : undefined}
                        aria-current={active ? 'step' : undefined}
                        aria-label={`Step ${i + 1}: ${item.title}`}
                        onClick={() => onGoTo(i)}
                      />
                    </li>
                  )
                })}
              </ol>
            </nav>
            <button type="button" data-presentation-next="" disabled={index >= last} onClick={onNext}>
              Next
            </button>
          </div>
        </>
      ) : null}
    </footer>
  )
}
