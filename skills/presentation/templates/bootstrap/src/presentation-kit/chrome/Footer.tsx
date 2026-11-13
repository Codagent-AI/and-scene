import type { Mode, StepMeta } from '../types'
export function Footer({ steps, index, mode, go, next, prev }: { steps: StepMeta[]; index: number; mode: Mode; go: (index: number) => void; next: () => void; prev: () => void }) {
  const step = steps[index]
  return <footer data-presentation-footer="">
    <h1 data-presentation-title="">{step.title}</h1>
    {mode === 'browse' && <>
      <p data-presentation-caption="">{step.caption}</p>
      <div data-presentation-controls="">
        <button data-presentation-prev="" aria-label="Previous step" disabled={index === 0} onClick={prev}>←</button>
        <nav data-presentation-progress="" aria-label="Steps">{steps.map((item, i) => <button key={item.id} aria-label={`Step ${i + 1}: ${item.title}`} aria-current={i === index ? 'step' : undefined} data-active={i === index} onClick={() => go(i)}>{String(i + 1).padStart(2,'0')}</button>)}</nav>
        <button data-presentation-next="" aria-label="Next step" disabled={index === steps.length - 1} onClick={next}>→</button>
      </div>
    </>}
  </footer>
}
