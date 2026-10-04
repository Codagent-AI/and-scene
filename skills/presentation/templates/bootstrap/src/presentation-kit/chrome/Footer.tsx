import type { PresentationMode, Step } from '../types'
export function Footer<T>({ title, step, steps, index, mode, goTo, next, prev }: { title: string; step: Step<T>; steps: readonly Step<T>[]; index: number; mode: PresentationMode; goTo: (index: number) => void; next: () => void; prev: () => void }) {
  return <footer className="presentation-footer" data-presentation-footer="">
    {mode === 'browse' ? <><div className="presentation-caption" data-presentation-caption=""><strong>{step.title}</strong><p>{step.caption}</p></div>
      <nav className="presentation-progress" aria-label="Presentation progress" data-presentation-progress="">{steps.map((item, i) => <button type="button" key={item.id} className="presentation-progress-item" data-presentation-progress-item="" data-presentation-active={i === index ? 'true' : 'false'} aria-label={`Go to step ${i + 1}: ${item.title}`} aria-current={i === index ? 'step' : undefined} onClick={() => goTo(i)} />)}</nav>
      <div className="presentation-controls"><button type="button" data-presentation-prev="" onClick={prev} disabled={index === 0}>Previous</button><button type="button" data-presentation-next="" onClick={next} disabled={index === steps.length - 1}>Next</button></div></> : <div className="presentation-live-title" data-presentation-live-title="">{title} — {step.title}</div>}
  </footer>
}
