import type { PresentationMode, Step } from '../types'
import { Toc } from './Toc'
export function Footer<T>({ steps, index, mode, onSelect, onPrev, onNext }: { steps: readonly Step<T>[]; index: number; mode: PresentationMode; onSelect: (i: number) => void; onPrev: () => void; onNext: () => void }) {
  const step = steps[index]!
  return <footer data-presentation-footer data-step-count={steps.length} data-step-index={index}>
    {mode === 'browse' ? <><div data-presentation-caption><h2>{step.title}</h2><p>{step.caption}</p></div><Toc<T> steps={steps} index={index} onSelect={onSelect} /><nav data-presentation-progress aria-label="Presentation steps">{steps.map((item, i) => <button key={item.id} type="button" aria-label={`Go to step ${i + 1}: ${item.title}`} aria-current={i === index ? 'step' : undefined} data-presentation-active={i === index ? 'true' : undefined} onClick={() => onSelect(i)}>{i + 1}</button>)}</nav><div data-presentation-controls><button type="button" onClick={onPrev} aria-label="Previous step">Previous</button><button type="button" onClick={onNext} aria-label="Next step">Next</button></div></> : <div data-presentation-present-title>{step.title}</div>}
    <a data-presentation-attribution href="https://github.com/and-scene/and-scene" target="_blank" rel="noreferrer" style={{ position: 'absolute', right: 0, bottom: 0 }}>made by and-scene</a>
  </footer>
}
