import type { Step } from '../types.js'
export function Footer<T>({ steps, index, mode, onGoTo, onPrev, onNext }: { steps: readonly Step<T>[]; index: number; mode: 'browse' | 'present'; onGoTo: (index: number) => void; onPrev: () => void; onNext: () => void }) {
  const active = steps[index]
  return <footer className={`presentation-footer presentation-footer-${mode}`} data-presentation-footer="">
    <div className="presentation-footer-copy">{mode === 'browse' ? <><h2 className="presentation-step-title">{active.title}</h2><p className="presentation-caption">{active.caption}</p></> : <><span className="presentation-step-marker">{active.era} · {String(index + 1).padStart(2, '0')}</span><p className="presentation-present-title">{active.title}</p></>}</div>
    {mode === 'browse' && <nav className="presentation-progress" aria-label="Step progress" data-presentation-progress="">{steps.map((step, stepIndex) => <button key={step.id} type="button" aria-label={`Go to step ${stepIndex + 1}: ${step.title}`} aria-current={stepIndex === index ? 'step' : undefined} className={`presentation-progress-item${stepIndex === index ? ' is-active' : ''}`} data-presentation-progress-item="" data-presentation-active={stepIndex === index ? 'true' : 'false'} onClick={() => onGoTo(stepIndex)} />)}</nav>}
    {mode === 'browse' && <div className="presentation-step-controls"><button type="button" className="presentation-prev" onClick={onPrev}>Previous</button><button type="button" className="presentation-next" onClick={onNext}>Next</button></div>}
  </footer>
}
