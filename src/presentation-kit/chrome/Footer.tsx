import type { Step } from '../types'
export function Footer<T>({ steps, index, mode, onPrev, onNext, onGoTo, onToggle }: { steps: readonly Step<T>[]; index: number; mode: 'browse' | 'present'; onPrev: () => void; onNext: () => void; onGoTo: (i: number) => void; onToggle: () => void }) {
  const step = steps[index]
  return <footer className="presentation-footer" data-presentation-footer="" data-mode={mode} data-step-count={steps.length} data-step-index={index} style={{ position: 'absolute', inset: 'auto 0 0' }}>
    <p className="presentation-marker" data-presentation-marker="">{String(index + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')} · {step.era}</p>
    <h2 className="presentation-step-title" data-presentation-step-title="">{step.title}</h2>
    {mode === 'browse' && <><p className="presentation-caption" data-presentation-caption="">{step.caption}</p>
      <nav className="presentation-progress" aria-label="Presentation steps" data-presentation-progress="">{steps.map((item, i) => <button key={item.id} type="button" aria-label={`Go to step ${i + 1}: ${item.title}`} aria-current={i === index ? 'step' : undefined} data-presentation-progress-item="" data-presentation-active={i === index ? 'true' : 'false'} onClick={() => onGoTo(i)}>{i + 1}</button>)}</nav>
      <div className="presentation-controls"><button type="button" onClick={onPrev} aria-label="Previous step" data-presentation-prev="">Previous</button><button type="button" onClick={onNext} aria-label="Next step" data-presentation-next="">Next</button></div>
    </>}
    <button type="button" onClick={onToggle} aria-label={mode === 'browse' ? 'Switch to present mode' : 'Switch to browse mode'} data-presentation-mode-toggle="">{mode === 'browse' ? 'Present' : 'Browse'}</button>
    <a className="presentation-attribution" data-presentation-attribution="" href="https://github.com/and-scene/and-scene" style={{ position: 'absolute', right: 0, bottom: 0 }}>made by and-scene</a>
  </footer>
}
