import type { PresentationMode } from '../types'

export const ATTRIBUTION_HREF = 'https://github.com/Codagent-AI/and-scene'

export interface FooterProps {
  mode: PresentationMode
  caption: string
  stepIndex: number
  stepCount: number
  onGoTo: (index: number) => void
  onPrev: () => void
  onNext: () => void
}

/**
 * Browse mode shows the multi-line caption, progress dots, and prev/next
 * controls; present mode hides all of that and keeps only the attribution
 * link, since the title in the header already carries present mode.
 */
export function Footer({ mode, caption, stepIndex, stepCount, onGoTo, onPrev, onNext }: FooterProps) {
  const isBrowse = mode === 'browse'

  return (
    <footer data-presentation-footer="true" data-presentation-mode={mode}>
      {isBrowse ? (
        <>
          <p data-presentation-caption="true">{caption}</p>
          <nav data-presentation-progress="true" aria-label="Step progress">
            {Array.from({ length: stepCount }, (_, index) => {
              const active = index === stepIndex
              return (
                <button
                  key={index}
                  type="button"
                  data-presentation-progress-item="true"
                  data-presentation-active={active ? 'true' : undefined}
                  aria-current={active ? 'step' : undefined}
                  aria-label={`Go to step ${index + 1} of ${stepCount}`}
                  onClick={() => onGoTo(index)}
                >
                  <span data-presentation-progress-dot="true" />
                </button>
              )
            })}
          </nav>
          <div data-presentation-nav="true">
            <button
              type="button"
              data-presentation-prev="true"
              disabled={stepIndex === 0}
              onClick={onPrev}
              aria-label="Previous step"
            >
              Prev
            </button>
            <button
              type="button"
              data-presentation-next="true"
              disabled={stepIndex === stepCount - 1}
              onClick={onNext}
              aria-label="Next step"
            >
              Next
            </button>
          </div>
        </>
      ) : null}
      <a
        data-presentation-attribution="true"
        href={ATTRIBUTION_HREF}
        target="_blank"
        rel="noreferrer noopener"
      >
        made by and-scene
      </a>
    </footer>
  )
}
