import type { PresentationMode } from '../types'

export interface FooterProps {
  mode: PresentationMode
  title: string
  caption: string
  stepIndex: number
  stepCount: number
  onPrev: () => void
  onNext: () => void
  onJump: (index: number) => void
}

export function Footer({
  mode,
  title,
  caption,
  stepIndex,
  stepCount,
  onPrev,
  onNext,
  onJump,
}: FooterProps) {
  return (
    <footer data-presentation-chrome="footer">
      {mode === 'present' ? (
        <p data-presentation-node="step-title">{title}</p>
      ) : (
        <>
          <p data-presentation-node="caption">{caption}</p>
          <div data-presentation-chrome="progress">
            {Array.from({ length: stepCount }, (_, index) => {
              const active = index === stepIndex
              return (
                <button
                  key={index}
                  type="button"
                  data-testid={`progress-dot-${index}`}
                  data-presentation-node="progress-dot"
                  data-presentation-active={active}
                  aria-current={active ? 'step' : undefined}
                  aria-label={`Go to step ${index + 1}`}
                  onClick={() => onJump(index)}
                />
              )
            })}
          </div>
          <div data-presentation-chrome="prev-next">
            <button type="button" onClick={onPrev} disabled={stepIndex === 0}>
              Prev
            </button>
            <button type="button" onClick={onNext} disabled={stepIndex === stepCount - 1}>
              Next
            </button>
          </div>
        </>
      )}
    </footer>
  )
}
