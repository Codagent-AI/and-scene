import type { StepMeta } from '../types'

interface FooterProps { steps: readonly Pick<StepMeta, 'id' | 'era' | 'title' | 'caption'>[]; index: number; mode: 'browse' | 'present'; title: string; onSelect: (index: number) => void; onPrev: () => void; onNext: () => void; attribution?: React.ReactNode | false }
export function Footer({ steps, index, mode, title, onSelect, onPrev, onNext, attribution }: FooterProps) {
  const current = steps[index]
  return <footer className="presentation-footer" data-presentation-footer="">
    <div className="presentation-footer__narrative">
      {mode === 'browse' ? <><p className="presentation-footer__title">{current?.title}</p><p className="presentation-footer__caption">{current?.caption}</p></> : <p className="presentation-footer__title">{current?.title ?? title}</p>}
    </div>
    {mode === 'browse' && <div className="presentation-footer__controls" data-presentation-controls="">
      <button type="button" className="presentation-prev" data-presentation-prev="" onClick={onPrev} disabled={index === 0} aria-label="Previous step">Previous</button>
      <nav className="presentation-progress" data-presentation-progress="" aria-label="Presentation steps">
        {steps.map((step, stepIndex) => <button type="button" key={step.id} className="presentation-progress__item" data-presentation-step="" data-presentation-active={stepIndex === index ? 'true' : 'false'} aria-label={`Step ${stepIndex + 1}: ${step.title}`} aria-current={stepIndex === index ? 'step' : undefined} onClick={() => onSelect(stepIndex)} />)}
      </nav>
      <button type="button" className="presentation-next" data-presentation-next="" onClick={onNext} disabled={index === steps.length - 1} aria-label="Next step">Next</button>
    </div>}
    {attribution !== false && <div className="presentation-attribution" data-presentation-attribution="">{attribution ?? <a href="https://github.com/and-scene/and-scene">made by and-scene</a>}</div>}
  </footer>
}
