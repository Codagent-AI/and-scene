import type { Mode, StepMeta } from '../types'
export function Footer({ steps, index, mode, go, next, prev }: {
  steps: readonly StepMeta[]; index: number; mode: Mode; go: (i: number) => void; next: () => void; prev: () => void
}) {
  const step = steps[index]
  return <footer data-presentation-footer="" style={{ position: 'absolute', left: 0, right: 0, bottom: 44 }}>
    <div data-presentation-marker="">{String(index + 1).padStart(2, '0')} / {step.era}</div>
    <h1 data-presentation-title="" style={{ whiteSpace: mode === 'present' ? 'nowrap' : undefined }}>{step.title}</h1>
    {mode === 'browse' && <>
      <p data-presentation-caption="">{step.caption}</p>
      <nav data-presentation-navigation="" aria-label="Step navigation">
        <button data-presentation-prev="" disabled={index === 0} onClick={prev} aria-label="Previous step">←</button>
        <div data-presentation-progress="">{steps.map((s, i) => <button key={s.id} data-presentation-progress-entry="" data-presentation-active={i === index} aria-current={i === index ? 'step' : undefined} aria-label={`Step ${i + 1}: ${s.title}`} onClick={() => go(i)}>{i + 1}</button>)}</div>
        <button data-presentation-next="" disabled={index === steps.length - 1} onClick={next} aria-label="Next step">→</button>
      </nav>
    </>}
  </footer>
}
