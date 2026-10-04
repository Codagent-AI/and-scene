import type { PresentationMode, Step } from '../types'

export function Footer<TPayload>({ mode, step, index, count, title, previous, next, goTo, attribution }: {
  mode: PresentationMode; step: Step<TPayload>; index: number; count: number; title: string
  previous: () => void; next: () => void; goTo: (index: number) => void; attribution: React.ReactNode | false
}) {
  return <footer className="presentation-footer" data-presentation-footer="">
    {mode === 'browse' ? <>
      <div className="presentation-caption" data-presentation-caption=""><strong>{step.title}</strong><p>{step.caption}</p></div>
      <nav className="presentation-progress" aria-label="Presentation progress" data-presentation-progress="">
        {Array.from({ length: count }, (_, item) => <button key={item} type="button" className="presentation-progress-item" data-presentation-progress-item="" data-active={item === index ? 'true' : 'false'} aria-label={`Go to step ${item + 1}`} aria-current={item === index ? 'step' : undefined} onClick={() => goTo(item)} />)}
      </nav>
      <div className="presentation-controls"><button type="button" onClick={previous} disabled={index === 0} aria-label="Previous step">Previous</button><button type="button" onClick={next} disabled={index === count - 1} aria-label="Next step">Next</button></div>
    </> : <div className="presentation-present-title" data-presentation-present-title="">{step.title}</div>}
    {attribution !== false && <div className="presentation-attribution" data-presentation-attribution="">{attribution ?? <a href="https://github.com/Codagent-AI/and-scene" target="_blank" rel="noreferrer">made by and-scene</a>}</div>}
    <span className="presentation-title-sr-only">{title}</span>
  </footer>
}
