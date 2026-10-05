import type { PresentationMode, Step } from '../types'
export function Footer<T>({ steps, index, mode, title, goTo, prev, next }: {
  steps: readonly Step<T>[]; index: number; mode: PresentationMode; title: string
  goTo: (index: number) => void; prev: () => void; next: () => void
}) {
  const step = steps[index]
  return <footer className="presentation-footer" data-presentation-footer="">
    <div className="presentation-footer__narration">
      {mode === 'present' ? <p data-presentation-present-title="">{step.title || title}</p> : <><h2 data-presentation-step-title="">{step.title}</h2><p data-presentation-caption="">{step.caption}</p></>}
    </div>
    {mode === 'browse' && <nav aria-label="Presentation steps" className="presentation-progress" data-presentation-progress="">
      <button type="button" aria-label="Previous step" className="presentation-control presentation-control--previous" onClick={prev} disabled={index === 0} data-presentation-previous="">Previous</button>
      <div className="presentation-progress__steps">{steps.map((item, itemIndex) => <button key={item.id} type="button" aria-label={`${itemIndex + 1}: ${item.title}`} aria-current={itemIndex === index ? 'step' : undefined} className="presentation-progress__step" data-presentation-step="" data-presentation-active={itemIndex === index ? 'true' : 'false'} onClick={() => goTo(itemIndex)}>{itemIndex + 1}</button>)}</div>
      <button type="button" aria-label="Next step" className="presentation-control presentation-control--next" onClick={next} disabled={index === steps.length - 1} data-presentation-next="">Next</button>
    </nav>}
  </footer>
}
