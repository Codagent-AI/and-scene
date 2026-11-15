import type { Mode, StepMeta } from '../types'
export function Footer({ steps, index, mode, jump, next, prev }: { steps: readonly StepMeta[]; index: number; mode: Mode; jump: (i: number) => void; next: () => void; prev: () => void }) {
  return <footer data-presentation-footer="" style={{ position: 'absolute', bottom: 45, left: 24, right: 24 }}>
    {mode === 'present' ? <h1 data-presentation-title="">{steps[index].title}</h1> : <>
      <p data-presentation-caption="">{steps[index].caption}</p>
      <div data-presentation-controls="" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button data-presentation-prev="" onClick={prev} disabled={index === 0} aria-label="Previous step">← Previous</button>
        <nav data-presentation-progress="" aria-label="Steps">{steps.map((step, i) => <button key={step.id} data-presentation-progress-step="" data-presentation-active={i === index ? 'true' : 'false'} aria-current={i === index ? 'step' : undefined} aria-label={`Step ${i + 1}: ${step.title}`} onClick={() => jump(i)}>{i + 1}</button>)}</nav>
        <button data-presentation-next="" onClick={next} disabled={index === steps.length - 1} aria-label="Next step">Next →</button>
      </div>
    </>}
  </footer>
}
