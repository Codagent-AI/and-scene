import type { Mode, StepMeta } from '../types'
export function Footer({ step, steps, index, mode, next, prev, jump }: { step: StepMeta; steps: readonly StepMeta[]; index: number; mode: Mode; next: () => void; prev: () => void; jump: (n: number) => void }) {
  return <footer data-presentation-footer="">
    {mode === 'present' && <h1 data-presentation-title="" style={{ whiteSpace: 'nowrap' }}>{step.title}</h1>}
    {mode === 'browse' && <>
      <p data-presentation-caption="">{step.caption}</p>
      <nav data-presentation-navigation="" aria-label="Step navigation" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <button data-presentation-prev="" onClick={prev} disabled={index === 0} aria-label="Previous step">← Previous</button>
        <div data-presentation-progress="" style={{ display: 'flex' }}>{steps.map((s, i) => <button key={s.id} data-presentation-progress-step="" data-presentation-active={i === index ? 'true' : 'false'} aria-current={i === index ? 'step' : undefined} aria-label={`Step ${i + 1}: ${s.title}`} onClick={() => jump(i)}>{i + 1}</button>)}</div>
        <button data-presentation-next="" onClick={next} disabled={index === steps.length - 1} aria-label="Next step">Next →</button>
      </nav>
    </>}
  </footer>
}
