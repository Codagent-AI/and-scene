import type { Step, PresentationMode } from '../types'
export function Footer<T>({ title, step, steps, index, mode, onSelect, onNext, onPrev }: { title: string; step: Step<T>; steps: readonly Step<T>[]; index: number; mode: PresentationMode; onSelect: (index: number) => void; onNext: () => void; onPrev: () => void }) {
  return <footer className="presentation-footer" data-presentation-footer="" data-step-count={steps.length} data-step-index={index}>
    {mode === 'browse' ? <div className="presentation-narration"><h2 data-presentation-step-title="">{step.title}</h2><p data-presentation-caption="">{step.caption}</p></div> : <p className="presentation-live-title" data-presentation-live-title="">{title}</p>}
    {mode === 'browse' && <nav className="presentation-progress" aria-label="Presentation steps" data-presentation-progress="">{steps.map((item, itemIndex) => <button type="button" key={item.id} className="presentation-progress-item" data-presentation-progress-item="" data-presentation-active={itemIndex === index ? 'true' : 'false'} aria-label={`${itemIndex + 1}: ${item.title}`} aria-current={itemIndex === index ? 'step' : undefined} onClick={() => onSelect(itemIndex)} />)}</nav>}
    {mode === 'browse' && <div className="presentation-controls"><button type="button" data-presentation-prev="" onClick={onPrev} disabled={index === 0} aria-label="Previous step">Previous</button><button type="button" data-presentation-next="" onClick={onNext} disabled={index === steps.length - 1} aria-label="Next step">Next</button></div>}
  </footer>
}
