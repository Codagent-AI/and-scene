import type { PresentationMode, Step } from '../types'
import { DEFAULT_ATTRIBUTION_URL } from '../constants'
export function Footer<T>({ steps, index, mode, title, onSelect, onNext, onPrev, attribution }: { steps: Step<T>[]; index: number; mode: PresentationMode; title: string; onSelect: (index: number) => void; onNext: () => void; onPrev: () => void; attribution?: false | { label?: string; href?: string } }) {
  const step = steps[index]
  return <footer className="presentation-footer" data-presentation-footer="">
    {mode === 'browse' ? <><div className="presentation-narration"><h2>{step.title}</h2><p>{step.caption}</p></div>
      <div className="presentation-navigation"><button type="button" onClick={onPrev} disabled={index === 0} aria-label="Previous step">Previous</button>
      <nav aria-label="Step progress" className="presentation-progress">{steps.map((item, itemIndex) => <button key={item.id} type="button" aria-label={`Go to step ${itemIndex + 1}: ${item.title}`} aria-current={index === itemIndex ? 'step' : undefined} data-presentation-progress-item="" data-presentation-active={index === itemIndex ? 'true' : 'false'} onClick={() => onSelect(itemIndex)}>{itemIndex + 1}</button>)}</nav>
      <span data-presentation-step-count="" data-step-count={steps.length} data-step-index={index}>Step {index + 1} of {steps.length}</span>
      <button type="button" onClick={onNext} disabled={index === steps.length - 1} aria-label="Next step">Next</button></div></> : <><div className="presentation-live-title" data-presentation-live-title="">{step.title || title}</div><span hidden data-step-count={steps.length} data-step-index={index} /></>}
    {attribution !== false && <a className="presentation-attribution" data-presentation-attribution="" href={attribution?.href ?? DEFAULT_ATTRIBUTION_URL} target="_blank" rel="noreferrer">{attribution?.label ?? 'made by and-scene'}</a>}
  </footer>
}
