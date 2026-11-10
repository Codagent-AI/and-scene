import type { Mode, StepMeta } from '../types'
export function Footer({ steps, index, mode, jump, prev, next }: {
  steps: readonly StepMeta[]; index: number; mode: Mode; jump: (index: number) => void; prev: () => void; next: () => void
}) {
  const step = steps[index]
  return <footer data-presentation-footer="" style={{ position: 'absolute', bottom: 42, left: 0, right: 0 }}>
    {mode === 'present' ? <h1 data-presentation-title="" style={{ whiteSpace: 'nowrap' }}>{step.title}</h1> : <>
      <p data-presentation-caption="">{step.caption}</p>
      <nav data-presentation-navigation="" aria-label="Steps">
        <button onClick={prev} disabled={index === 0} aria-label="Previous step">Previous</button>
        <div data-presentation-progress="">{steps.map((s, i) => <button key={s.id} data-presentation-progress-entry="" data-presentation-active={i === index ? 'true' : 'false'} aria-current={i === index ? 'step' : undefined} aria-label={`Step ${i + 1}: ${s.title}`} onClick={() => jump(i)}>{i + 1}</button>)}</div>
        <button onClick={next} disabled={index === steps.length - 1} aria-label="Next step">Next</button>
      </nav>
    </>}
  </footer>
}
