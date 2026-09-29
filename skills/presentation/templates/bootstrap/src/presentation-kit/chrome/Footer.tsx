import type { Step } from '../types'
export function Footer<T>({ step, index, steps, mode, onPrevious, onNext, onJump }: {
  step: Step<T>; index: number; steps: readonly Step<T>[]; mode: 'browse' | 'present'
  onPrevious: () => void; onNext: () => void; onJump: (index: number) => void
}) {
  return <footer className="presentation-footer" data-presentation-footer="">
    {mode === 'present' ? <p className="presentation-present-title" data-presentation-present-title=""><span className="presentation-step-marker">{String(index + 1).padStart(2, '0')}</span> {step.title}</p> : <>
      <div className="presentation-browse-copy"><p className="presentation-step-title">{step.title}</p><p className="presentation-caption">{step.caption}</p></div>
      <nav className="presentation-progress" aria-label="Presentation steps" data-presentation-progress="">
        {steps.map((item, itemIndex) => <button type="button" key={item.id} aria-label={`Go to step ${itemIndex + 1}: ${item.title}`} aria-current={index === itemIndex ? 'step' : undefined} data-presentation-progress-item="" data-presentation-active={index === itemIndex ? 'true' : 'false'} onClick={() => onJump(itemIndex)} />)}
      </nav>
      <div className="presentation-controls"><button type="button" onClick={onPrevious} disabled={index === 0} aria-label="Previous step">Previous</button><span>{index + 1} / {steps.length}</span><button type="button" onClick={onNext} disabled={index === steps.length - 1} aria-label="Next step">Next</button></div>
    </>}
  </footer>
}
