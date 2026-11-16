import type { Mode, StepMeta } from '../types'
export function Footer({ steps, index, mode, jump, next, prev }: { steps: readonly StepMeta[]; index: number; mode: Mode; jump: (i: number) => void; next: () => void; prev: () => void }) {
  const step = steps[index]
  return <footer data-presentation-footer="">
    <span data-presentation-marker="">{String(index + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')} · {step.era}</span>
    <h1 data-presentation-title="">{step.title}</h1>
    {mode === 'browse' && <><p data-presentation-caption="">{step.caption}</p>
      <nav data-presentation-navigation="" aria-label="Steps"><button data-presentation-prev="" onClick={prev} disabled={index === 0} aria-label="Previous step">←</button>
        <div data-presentation-progress="">{steps.map((s, i) => <button key={s.id} data-presentation-progress-entry="" data-presentation-active={i === index}
          aria-current={i === index ? 'step' : undefined} aria-label={`Step ${i + 1}: ${s.title}`} onClick={() => jump(i)}>{i + 1}</button>)}</div>
        <button data-presentation-next="" onClick={next} disabled={index === steps.length - 1} aria-label="Next step">→</button></nav>
    </>}
  </footer>
}
