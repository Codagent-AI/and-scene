import type { PresentationMode, Step } from '../types'
export function Footer<T>({ steps, index, mode, title, next, prev, goTo, toggleMode, attribution }: { steps: readonly Step<T>[]; index: number; mode: PresentationMode; title: string; next: () => void; prev: () => void; goTo: (i: number) => void; toggleMode: () => void; attribution: boolean }) {
  const step = steps[index]!
  return <footer className="presentation-footer" data-presentation-footer data-step-count={steps.length} data-step-index={index}>
    {mode === 'browse' ? <><div className="presentation-narration"><h2>{step.title}</h2><p>{step.caption}</p></div><nav className="presentation-progress" aria-label="Presentation steps">{steps.map((item, i) => <button key={item.id} type="button" aria-label={`${i + 1}. ${item.title}`} aria-current={i === index ? 'step' : undefined} data-presentation-progress data-presentation-active={i === index ? 'true' : undefined} onClick={() => goTo(i)}>{i + 1}</button>)}</nav><div className="presentation-controls"><button type="button" onClick={prev} aria-label="Previous step" data-presentation-prev>Previous</button><button type="button" onClick={next} aria-label="Next step" data-presentation-next>Next</button></div></> : <div className="presentation-present-title">{title} — {step.title}</div>}
    <button className="presentation-mode-toggle" type="button" onClick={toggleMode} aria-label={`Switch to ${mode === 'browse' ? 'present' : 'browse'} mode`} data-presentation-mode-toggle>{mode === 'browse' ? 'Present' : 'Browse'}</button>
    {attribution && <a className="presentation-attribution" data-presentation-attribution href="https://github.com/and-scene/and-scene" target="_blank" rel="noreferrer">made by and-scene</a>}
  </footer>
}
