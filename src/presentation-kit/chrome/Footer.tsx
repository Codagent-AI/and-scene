import type { PresentationMode, Step } from '../types'
export function Footer<T>({ step, index, steps, mode, onSelect, onNext, onPrev }: { step: Step<T>; index: number; steps: readonly Step<T>[]; mode: PresentationMode; onSelect: (index: number) => void; onNext: () => void; onPrev: () => void }) {
  if (mode === 'present') return <footer className="presentation-footer presentation-footer--present" data-presentation-footer style={{ minHeight: 48, display: 'flex', alignItems: 'center' }}><p data-presentation-present-title style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{step.title}</p></footer>
  return <footer className="presentation-footer" data-presentation-footer style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, minHeight: 112 }}>
    <div className="presentation-footer__narration"><strong>{step.title}</strong><p>{step.caption}</p></div>
    <nav className="presentation-progress" aria-label="Step progress" data-presentation-progress>
      <button type="button" aria-label="Previous step" onClick={onPrev}>Previous</button>
      {steps.map((item, position) => <button key={item.id} type="button" aria-label={`Step ${position + 1}`} aria-current={position === index ? 'step' : undefined} data-presentation-progress-item data-presentation-active={position === index ? 'true' : 'false'} onClick={() => onSelect(position)}>{position + 1}</button>)}
      <button type="button" aria-label="Next step" onClick={onNext}>Next</button>
    </nav>
  </footer>
}
