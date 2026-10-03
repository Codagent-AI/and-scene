import type { PresentationMode } from '../constants'
import type { Step } from '../types'

interface FooterProps {
  mode: PresentationMode
  steps: readonly Pick<Step, 'id' | 'title'>[]
  index: number
  caption: string
  title: string
  onPrev: () => void
  onNext: () => void
  onGoTo: (index: number) => void
}

export function Footer({ mode, steps, index, caption, title, onPrev, onNext, onGoTo }: FooterProps) {
  const browse = mode === 'browse'
  return (
    <footer className="presentation-footer" data-presentation-footer="">
      <h2 className="presentation-step-title" data-presentation-title="">
        {title}
      </h2>
      {browse && (
        <>
          <p className="presentation-caption" data-presentation-caption="">
            {caption}
          </p>
          <nav
            className="presentation-controls"
            data-presentation-controls=""
            aria-label="Step navigation"
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <button
              type="button"
              className="presentation-prev"
              data-presentation-prev=""
              aria-label="Previous step"
              disabled={index === 0}
              onClick={onPrev}
            >
              Previous
            </button>
            <ol
              className="presentation-progress"
              data-presentation-progress=""
              style={{ display: 'flex' }}
            >
              {steps.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className="presentation-progress-item"
                    data-presentation-progress-item=""
                    data-presentation-active={i === index ? 'true' : 'false'}
                    aria-current={i === index ? 'step' : undefined}
                    aria-label={`Step ${i + 1}: ${s.title}`}
                    onClick={() => onGoTo(i)}
                  />
                </li>
              ))}
            </ol>
            <button
              type="button"
              className="presentation-next"
              data-presentation-next=""
              aria-label="Next step"
              disabled={index === steps.length - 1}
              onClick={onNext}
            >
              Next
            </button>
          </nav>
        </>
      )}
    </footer>
  )
}
