import type { Mode, StepMeta } from '../types'
export function Footer({ steps, index, mode, next, prev, jump }: { steps: readonly StepMeta[]; index: number; mode: Mode; next: () => void; prev: () => void; jump: (index: number) => void }) {
  return <footer data-presentation-footer="" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
    {mode === 'present' ? <h1 data-presentation-title="">{steps[index].title}</h1> : <>
      <p data-presentation-caption="">{steps[index].caption}</p>
      <nav aria-label="Step navigation" data-presentation-nav="">
        <button onClick={prev} disabled={index === 0} aria-label="Previous step">←</button>
        <div data-presentation-progress="">{steps.map((step, i) => <button key={step.id} aria-label={`Step ${i + 1}: ${step.title}`} aria-current={i === index ? 'step' : undefined} data-presentation-progress-item="" data-presentation-active={i === index ? 'true' : 'false'} onClick={() => jump(i)}>{i + 1}</button>)}</div>
        <button onClick={next} disabled={index === steps.length - 1} aria-label="Next step">→</button>
      </nav>
    </>}
  </footer>
}
