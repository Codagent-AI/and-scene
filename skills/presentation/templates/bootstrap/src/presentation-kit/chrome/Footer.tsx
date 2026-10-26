import type { PresentationMode } from '../types'

export interface FooterProps {
  mode: PresentationMode
  /** Multi-line browse-mode reading caption. */
  caption: string
  stepIndex: number
  stepCount: number
  onSelectStep: (index: number) => void
  onPrev: () => void
  onNext: () => void
  canPrev: boolean
  canNext: boolean
}

/**
 * Present mode renders nothing (Header alone carries marker + title).
 * Browse mode shows the reading caption, step progress indicators, and
 * prev/next controls.
 */
export function Footer({
  mode,
  caption,
  stepIndex,
  stepCount,
  onSelectStep,
  onPrev,
  onNext,
  canPrev,
  canNext,
}: FooterProps) {
  if (mode === 'present') {
    return null
  }

  return (
    <footer className="sk-footer sk-footer--browse" data-scene-kit="footer">
      <p className="sk-footer__caption" data-scene-kit="caption">
        {caption}
      </p>
      <div className="sk-footer__progress" data-scene-kit="progress" role="tablist" aria-label="Steps">
        {Array.from({ length: stepCount }, (_, index) => {
          const isActive = index === stepIndex
          return (
            <button
              key={index}
              type="button"
              className="sk-progress-dot"
              data-scene-kit="progress-dot"
              data-active={isActive ? 'true' : 'false'}
              aria-current={isActive ? 'step' : undefined}
              aria-label={`Go to step ${index + 1}`}
              onClick={() => onSelectStep(index)}
            >
              <span className="sk-progress-dot__mark" data-scene-kit="progress-dot-mark" />
            </button>
          )
        })}
      </div>
      <div className="sk-footer__nav" data-scene-kit="nav-controls">
        <button
          type="button"
          className="sk-nav-button sk-nav-button--prev"
          data-scene-kit="prev-button"
          onClick={onPrev}
          disabled={!canPrev}
        >
          Prev
        </button>
        <button
          type="button"
          className="sk-nav-button sk-nav-button--next"
          data-scene-kit="next-button"
          onClick={onNext}
          disabled={!canNext}
        >
          Next
        </button>
      </div>
    </footer>
  )
}
