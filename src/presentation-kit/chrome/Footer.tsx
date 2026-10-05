import type { Step } from '../types'
export function Footer<T>({ steps, index, mode, title, onSelect, onPrev, onNext, attribution }: { steps: readonly Step<T>[]; index: number; mode: 'browse' | 'present'; title: string; onSelect: (index: number) => void; onPrev: () => void; onNext: () => void; attribution?: React.ReactNode }) {
  const step = steps[index]
  return <footer className={`presentation-footer presentation-footer--${mode}`} data-presentation-footer="" data-step-count={steps.length} data-step-index={index}>
    <div className="presentation-footer__content">
      {mode === 'browse' ? <><div className="presentation-footer__narration"><span data-presentation-era="">{step.era}</span><p data-presentation-caption="">{step.caption}</p></div><div className="presentation-footer__controls"><button type="button" onClick={onPrev} aria-label="Previous step" data-presentation-prev="">Previous</button><div className="presentation-progress" role="group" aria-label="Step progress">{steps.map((item, itemIndex) => <button type="button" key={item.id} aria-label={`Go to step ${itemIndex + 1}: ${item.title}`} aria-current={itemIndex === index ? 'step' : undefined} data-presentation-progress="" data-presentation-active={itemIndex === index ? 'true' : 'false'} onClick={() => onSelect(itemIndex)} />)}</div><button type="button" onClick={onNext} aria-label="Next step" data-presentation-next="">Next</button></div></> : <strong className="presentation-footer__present-title">{title}</strong>}
    </div>
    {attribution ?? <a className="presentation-attribution" data-presentation-attribution="" href="https://github.com/and-scene" target="_blank" rel="noreferrer">made by and-scene</a>}
  </footer>
}
