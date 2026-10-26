import type { PresentationMode } from '../types'

export interface FooterProps {
  mode: PresentationMode
  title: string
  caption: string
  stepCount: number
  activeIndex: number
  onGoTo: (index: number) => void
  onNext: () => void
  onPrev: () => void
}

export function Footer({
  mode,
  title,
  caption,
  stepCount,
  activeIndex,
  onGoTo,
  onNext,
  onPrev,
}: FooterProps) {
  if (mode === 'present') {
    return (
      <footer data-presentation-footer="" data-presentation-mode={mode}>
        <span data-presentation-footer-title="">{title}</span>
      </footer>
    )
  }

  return (
    <footer data-presentation-footer="" data-presentation-mode={mode}>
      <p data-presentation-caption="">{caption}</p>
      <nav data-presentation-progress="" aria-label="Step progress">
        {Array.from({ length: stepCount }, (_, index) => {
          const active = index === activeIndex
          return (
            <button
              key={index}
              type="button"
              data-testid="progress-dot"
              data-presentation-progress-dot=""
              data-active={active}
              aria-current={active ? 'step' : undefined}
              aria-label={`Go to step ${index + 1}`}
              onClick={() => onGoTo(index)}
            />
          )
        })}
      </nav>
      <div data-presentation-nav-controls="">
        <button type="button" onClick={onPrev} disabled={activeIndex === 0}>
          Prev
        </button>
        <button type="button" onClick={onNext} disabled={activeIndex === stepCount - 1}>
          Next
        </button>
      </div>
    </footer>
  )
}
