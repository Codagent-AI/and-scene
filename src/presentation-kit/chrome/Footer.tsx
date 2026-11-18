import type { Mode, StepMeta } from '../types'
export function Footer({ steps, index, mode, go, next, prev }: { steps: StepMeta[]; index: number; mode: Mode; go: (index: number) => void; next: () => void; prev: () => void }) {
  return <footer data-presentation-footer="">
    <h1 data-presentation-title="">{steps[index].title}</h1>
    {mode === 'browse' && <>
      <p data-presentation-caption="">{steps[index].caption}</p>
      <nav data-presentation-controls="" aria-label="Steps">
        <button onClick={prev} disabled={index === 0} aria-label="Previous step">←</button>
        <div data-presentation-progress="">{steps.map((step, i) => <button key={step.id} onClick={() => go(i)} data-presentation-active={i === index} aria-current={i === index ? 'step' : undefined} aria-label={`Step ${i + 1}: ${step.title}`}>{i + 1}</button>)}</div>
        <button onClick={next} disabled={index === steps.length - 1} aria-label="Next step">→</button>
      </nav>
    </>}
  </footer>
}
