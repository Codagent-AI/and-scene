import type { ReactNode } from 'react'
import type { PresentationMode, Step } from '../types'

export function Footer<T>({ steps, index, mode, title, onGoTo, onPrev, onNext, attribution }: {
  steps: readonly Step<T>[]; index: number; mode: PresentationMode; title: string
  onGoTo: (index: number) => void; onPrev: () => void; onNext: () => void; attribution: ReactNode
}) {
  const step = steps[index]
  return <footer className="presentation-footer" data-step-count={steps.length} data-step-index={index} data-presentation-footer="">
    {mode === 'browse' ? <>
      <div className="presentation-caption" aria-live="polite"><strong>{step.title}</strong><p>{step.caption}</p></div>
      <nav className="presentation-progress" aria-label="Presentation progress" data-presentation-progress="">
        {steps.map((item, itemIndex) => <button key={item.id} type="button" className="presentation-progress-item" data-presentation-progress-item="" data-active={itemIndex === index ? 'true' : 'false'} aria-current={itemIndex === index ? 'step' : undefined} aria-label={`Go to step ${itemIndex + 1}: ${item.title}`} onClick={() => onGoTo(itemIndex)} />)}
      </nav>
      <div className="presentation-controls"><button type="button" onClick={onPrev} aria-label="Previous step" disabled={index === 0}>←</button><span>{index + 1} / {steps.length}</span><button type="button" onClick={onNext} aria-label="Next step" disabled={index === steps.length - 1}>→</button></div>
    </> : <div className="presentation-present-title" aria-live="polite">{title} — {step.title}</div>}
    {attribution}
  </footer>
}
