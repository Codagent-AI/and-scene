import type { PresentationMode, Step } from '../types'

type FooterProps<TPayload> = {
  title: string
  mode: PresentationMode
  step: Step<TPayload>
  steps: readonly Step<TPayload>[]
  activeIndex: number
  onSelect: (index: number) => void
  onNext: () => void
  onPrev: () => void
}

export function Footer<TPayload>({ title, mode, step, steps, activeIndex, onSelect, onNext, onPrev }: FooterProps<TPayload>) {
  return (
    <footer className="presentation-footer" data-presentation-footer>
      {mode === 'browse' ? <p className="presentation-footer__caption" data-presentation-caption>{step.caption}</p> : <p className="presentation-footer__present-title">{title}</p>}
      {mode === 'browse' && (
        <div className="presentation-footer__controls" data-presentation-controls>
          <button type="button" data-presentation-prev onClick={onPrev} aria-label="Previous step">Previous</button>
          <div className="presentation-progress" data-presentation-progress aria-label="Presentation progress">
            {steps.map((item, index) => <button key={item.id} type="button" data-presentation-progress-item data-active={index === activeIndex ? 'true' : 'false'} aria-current={index === activeIndex ? 'step' : undefined} onClick={() => onSelect(index)} aria-label={`Go to step ${index + 1}`} />)}
          </div>
          <button type="button" data-presentation-next onClick={onNext} aria-label="Next step">Next</button>
        </div>
      )}
    </footer>
  )
}
