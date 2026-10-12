import type { StepMeta, PresentationMode } from '../types'
export function Footer({ step, index, count, mode, onPrev, onNext, goTo }: {
  step: StepMeta; index: number; count: number; mode: PresentationMode
  onPrev: () => void; onNext: () => void; goTo: (index: number) => void
}) {
  return <footer data-presentation-footer="true">
    {mode === 'browse' ? <p data-presentation-caption="true">{step.caption}</p> : <p data-presentation-title="true">{step.title}</p>}
    {mode === 'browse' && <nav aria-label="Step progress" data-presentation-progress="true">{Array.from({ length: count }, (_, item) => <button key={item} type="button" aria-label={`Go to step ${item + 1}`} aria-current={item === index ? 'step' : undefined} data-presentation-progress-item="true" data-presentation-active={item === index ? 'true' : undefined} onClick={() => goTo(item)}>{item + 1}</button>)}</nav>}
    {mode === 'browse' && <div><button type="button" data-presentation-prev="true" disabled={index === 0} onClick={onPrev}>Previous</button><button type="button" data-presentation-next="true" disabled={index === count - 1} onClick={onNext}>Next</button></div>}
  </footer>
}
