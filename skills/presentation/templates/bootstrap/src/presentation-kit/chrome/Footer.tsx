import type { StepMeta } from '../types'
export function Footer({ step, index, count, goTo, prev, next, attribution }: { step: StepMeta; index: number; count: number; goTo: (index: number) => void; prev: () => void; next: () => void; attribution?: React.ReactNode }) {
  return <footer className="presentation-footer" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2 }} data-presentation-footer="">
    <div className="presentation-caption" data-presentation-caption=""><h1>{step.title}</h1><p>{step.caption}</p></div>
    <nav className="presentation-progress" aria-label="Presentation progress" data-presentation-progress="">
      {Array.from({ length: count }, (_, i) => <button key={i} type="button" aria-label={`Go to step ${i + 1}`} aria-current={i === index ? 'step' : undefined} data-presentation-progress-item="" data-presentation-active={i === index ? 'true' : 'false'} onClick={() => goTo(i)}>{i + 1}</button>)}
    </nav>
    <div className="presentation-controls"><button type="button" onClick={prev} aria-label="Previous step">Previous</button><button type="button" onClick={next} aria-label="Next step">Next</button></div>
    {attribution ?? <a className="presentation-attribution" data-presentation-attribution="" href="https://github.com/and-scene/and-scene" target="_blank" rel="noreferrer">made by and-scene</a>}
  </footer>
}
