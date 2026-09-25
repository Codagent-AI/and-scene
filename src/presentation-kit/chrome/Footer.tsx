import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { PresentationMode, StepMeta } from '../types'

export function Footer({ title, step, steps, index, mode, goTo, prev, next }: { title: string; step: StepMeta; steps: readonly StepMeta[]; index: number; mode: PresentationMode; goTo: (index: number) => void; prev: () => void; next: () => void }) {
  return <footer className="presentation-footer" data-presentation-footer="">
    {mode === 'browse' ? <div className="presentation-footer__reading" data-presentation-reading=""><h2>{step.title}</h2><p>{step.caption}</p></div> : <div className="presentation-footer__present-title" data-presentation-present-title="">{step.title || title}</div>}
    {mode === 'browse' && <nav className="presentation-progress" aria-label="Step progress" data-presentation-progress="">
      <button className="presentation-progress__previous" type="button" onClick={prev} aria-label="Previous step" data-presentation-previous=""><ArrowLeft aria-hidden="true" /></button>
      <div className="presentation-progress__steps">{steps.map((item, itemIndex) => <button key={item.id} type="button" className="presentation-progress__step" aria-label={`Go to step ${itemIndex + 1}: ${item.title}`} aria-current={itemIndex === index ? 'step' : undefined} data-presentation-progress-step="" data-presentation-active={itemIndex === index ? 'true' : undefined} onClick={() => goTo(itemIndex)}>{itemIndex + 1}</button>)}</div>
      <button className="presentation-progress__next" type="button" onClick={next} aria-label="Next step" data-presentation-next=""><ArrowRight aria-hidden="true" /></button>
    </nav>}
  </footer>
}
