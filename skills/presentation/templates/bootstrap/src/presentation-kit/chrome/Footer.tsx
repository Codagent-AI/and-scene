import type { Mode, StepMeta } from '../types'
export function Footer({ steps, index, mode, go, prev, next }: { steps: readonly StepMeta[]; index: number; mode: Mode; go: (index: number) => void; prev: () => void; next: () => void }) {
  return <footer data-presentation-footer="" style={{ position: 'absolute', bottom: 58, left: 28, right: 28 }}>
    {mode === 'present' ? <h1 data-presentation-title="">{steps[index].title}</h1> : <>
      <p data-presentation-caption="" aria-live="polite">{steps[index].caption}</p>
      <nav data-presentation-controls="" aria-label="Steps">
        <button data-presentation-prev="" onClick={prev} disabled={index === 0}>← Previous</button>
        <div data-presentation-progress-list="">{steps.map((step, i) => <button key={step.id} data-presentation-progress="" data-active={i === index} aria-current={i === index ? 'step' : undefined} aria-label={`Step ${i + 1}: ${step.title}`} onClick={() => go(i)}>{i + 1}</button>)}</div>
        <button data-presentation-next="" onClick={next} disabled={index === steps.length - 1}>Next →</button>
      </nav>
    </>}
  </footer>
}
