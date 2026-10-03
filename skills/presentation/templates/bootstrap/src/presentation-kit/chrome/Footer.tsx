import type { PresentationMode, Step } from '../types'

export function Footer<TPayload>({ steps, index, mode, next, prev, goTo, title, toggleMode }: { steps: readonly Step<TPayload>[]; index: number; mode: PresentationMode; next: () => void; prev: () => void; goTo: (index: number) => void; title: string; toggleMode: () => void }) {
  const step = steps[index]
  return <footer className="presentation-footer" data-presentation-footer>
    <div className="presentation-footer-narration" data-presentation-narration>
      {mode === 'browse' ? <p className="presentation-caption" data-presentation-caption>{step.caption}</p> : <p className="presentation-present-title" data-presentation-present-title>{step.title}</p>}
      <span className="presentation-footer-title" hidden>{title}</span>
    </div>
    {mode === 'browse' && <div className="presentation-footer-controls" data-presentation-controls>
      <button type="button" className="presentation-previous" aria-label="Previous step" onClick={prev}>Previous</button>
      <nav className="presentation-progress" data-presentation-progress aria-label="Step progress">
        {steps.map((item, stepIndex) => <button key={item.id} type="button" className="presentation-progress-item" data-presentation-progress-item data-active={index === stepIndex ? 'true' : 'false'} aria-label={`${stepIndex + 1}. ${item.title}`} aria-current={index === stepIndex ? 'step' : undefined} onClick={() => goTo(stepIndex)} />)}
      </nav>
      <button type="button" className="presentation-next" aria-label="Next step" onClick={next}>Next</button>
      <button type="button" className="presentation-mode-toggle" aria-label="Switch to present mode" onClick={toggleMode}>Present</button>
    </div>}
    {mode === 'present' && <button type="button" className="presentation-mode-toggle" aria-label="Switch to browse mode" onClick={toggleMode}>Browse</button>}
  </footer>
}
