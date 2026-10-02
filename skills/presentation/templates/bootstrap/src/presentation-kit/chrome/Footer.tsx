import type { Step, PresentationMode } from '../types'

export function Footer<T>({ step, steps, index, mode, title, onPrev, onNext, onGoTo, attribution }: {
  step: Step<T>; steps: readonly Step<T>[]; index: number; mode: PresentationMode; title: string
  onPrev: () => void; onNext: () => void; onGoTo: (index: number) => void; attribution: React.ReactNode | false
}) {
  return <footer className={`presentation-footer presentation-footer-${mode}`} data-presentation-footer="">
    {mode === 'browse' ? <div className="presentation-caption" data-presentation-caption=""><strong>{step.title}</strong><p>{step.caption}</p></div> : <div className="presentation-live-title" data-presentation-live-title=""><span data-presentation-marker="">{index + 1}</span><span>{step.title || title}</span></div>}
    {mode === 'browse' && <nav className="presentation-progress" aria-label="Presentation steps" data-presentation-progress="">
      {steps.map((item, itemIndex) => <button key={item.id} type="button" className="presentation-progress-item" data-presentation-progress-item="" data-presentation-active={itemIndex === index ? 'true' : 'false'} aria-label={`Go to step ${itemIndex + 1}: ${item.title}`} aria-current={itemIndex === index ? 'step' : undefined} onClick={() => onGoTo(itemIndex)}><span>{itemIndex + 1}</span></button>)}
    </nav>}
    <div className="presentation-controls" data-presentation-controls="">
      <button type="button" data-presentation-prev="" onClick={onPrev} disabled={index === 0} aria-label="Previous step">Previous</button>
      <span data-presentation-step-number="">{index + 1} / {steps.length}</span>
      <button type="button" data-presentation-next="" onClick={onNext} disabled={index === steps.length - 1} aria-label="Next step">Next</button>
    </div>
    {attribution !== false && <div className="presentation-attribution" data-presentation-attribution="">{attribution ?? <a href="https://github.com/and-scene/and-scene">made by and-scene</a>}</div>}
  </footer>
}
