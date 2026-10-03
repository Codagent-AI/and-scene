import type { PresentationMode, Step } from '../types'

export function Footer<TPayload>({ steps, index, mode, goTo, next, prev, title, attribution }: {
  steps: readonly Step<TPayload>[]; index: number; mode: PresentationMode; goTo: (index: number) => void; next: () => void; prev: () => void; title: string; attribution: React.ReactNode
}) {
  const step = steps[index]
  return <footer className="presentation-footer" data-presentation-footer="">
    {mode === 'browse' && <div className="presentation-narration" data-presentation-narration=""><h1>{step?.title}</h1><p>{step?.caption}</p></div>}
    {mode === 'present' && <div className="presentation-present-title" data-presentation-present-title="">{step?.title || title}</div>}
    {mode === 'browse' && <div className="presentation-controls" data-presentation-controls="">
      <button type="button" onClick={prev} aria-label="Previous step" data-presentation-previous="">Previous</button>
      <nav aria-label="Step progress" className="presentation-progress" data-presentation-progress="">
        {steps.map((item, i) => <button key={item.id} type="button" onClick={() => goTo(i)} aria-label={`Step ${i + 1}: ${item.title}`} aria-current={i === index ? 'step' : undefined} data-presentation-active={i === index ? 'true' : 'false'} data-presentation-progress-item="" />)}
      </nav>
      <button type="button" onClick={next} aria-label="Next step" data-presentation-next="">Next</button>
    </div>}
    {attribution}
  </footer>
}
