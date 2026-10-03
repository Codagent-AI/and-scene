import type { PresentationMode, StepMeta } from '../types'
import type { ReactNode } from 'react'

export function Footer({ mode, title, step, steps, index, onSelect, onPrevious, onNext, attribution }: { mode: PresentationMode; title: string; step: StepMeta; steps: readonly StepMeta[]; index: number; onSelect: (index: number) => void; onPrevious: () => void; onNext: () => void; attribution?: ReactNode }) {
  return <footer data-presentation-footer="true">
    {mode === 'browse' ? <p data-presentation-caption="true">{step.caption}</p> : <p data-presentation-present-title="true">{title} · {step.title}</p>}
    {mode === 'browse' ? <div data-presentation-controls="true">
      <button type="button" data-presentation-prev="true" onClick={onPrevious} disabled={index === 0} aria-label="Previous step">Previous</button>
      <div data-presentation-progress="true" aria-label="Steps">{steps.map((item, itemIndex) => <button key={item.id} type="button" data-presentation-progress-item="true" data-active={itemIndex === index ? 'true' : 'false'} aria-current={itemIndex === index ? 'step' : undefined} aria-label={`Go to step ${itemIndex + 1}: ${item.title}`} onClick={() => onSelect(itemIndex)} />)}</div>
      <button type="button" data-presentation-next="true" onClick={onNext} disabled={index === steps.length - 1} aria-label="Next step">Next</button>
    </div> : null}
    <div data-presentation-attribution="true">{attribution ?? <a href="https://github.com/openai/and-scene">made by and-scene</a>}</div>
  </footer>
}
