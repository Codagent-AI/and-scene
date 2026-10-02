import type { PresentationMode, Step } from '../types'

export function Footer<T>({ step, index, total, mode, onSelect, onPrev, onNext }: { step: Step<T>; index: number; total: number; mode: PresentationMode; onSelect: (index: number) => void; onPrev: () => void; onNext: () => void }) {
  return <footer className="presentation-footer" data-presentation-footer>
    <div className="presentation-footer__narration" data-presentation-narration>
      <p className="presentation-marker" data-presentation-marker>{step.section} · {String(index + 1).padStart(2, '0')}</p>
      <h2 className="presentation-step-title" data-presentation-step-title>{step.title}</h2>
      {mode === 'browse' && <p className="presentation-caption" data-presentation-caption>{step.caption}</p>}
    </div>
    {mode === 'browse' && <nav className="presentation-progress" data-presentation-progress aria-label="Step progress">
      <button type="button" className="presentation-nav-button" data-presentation-previous onClick={onPrev} disabled={index === 0} aria-label="Previous step">Previous</button>
      <div className="presentation-progress__items">{Array.from({ length: total }, (_, item) => <button type="button" key={item} className="presentation-progress__item" data-presentation-progress-item data-presentation-active={item === index ? 'true' : 'false'} aria-label={`Go to step ${item + 1}`} aria-current={item === index ? 'step' : undefined} onClick={() => onSelect(item)} />)}</div>
      <button type="button" className="presentation-nav-button" data-presentation-next onClick={onNext} disabled={index === total - 1} aria-label="Next step">Next</button>
    </nav>}
  </footer>
}
