import type { Mode, StepMeta } from '../types'
export function Footer({ steps, index, mode, jump, next, prev }: { steps: readonly StepMeta[]; index: number; mode: Mode; jump: (i: number) => void; next: () => void; prev: () => void }) {
  return <footer data-presentation-footer="">
    {mode === 'present' ? <h1 data-presentation-title="" style={{ whiteSpace: 'nowrap' }}>{steps[index].title}</h1> : <>
      <p data-presentation-caption="">{steps[index].caption}</p>
      <nav data-presentation-navigation="" aria-label="Step navigation" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <button data-presentation-prev="" disabled={index === 0} onClick={prev} aria-label="Previous step">←</button>
        {steps.map((step, i) => <button key={step.id} data-presentation-progress="" data-presentation-active={i === index ? 'true' : 'false'} aria-current={i === index ? 'step' : undefined} aria-label={`Step ${i + 1}: ${step.title}`} onClick={() => jump(i)}>{i + 1}</button>)}
        <button data-presentation-next="" disabled={index === steps.length - 1} onClick={next} aria-label="Next step">→</button>
      </nav>
    </>}
  </footer>
}
