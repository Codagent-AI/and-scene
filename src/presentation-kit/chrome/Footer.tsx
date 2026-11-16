import type { Mode, StepMeta } from '../types'
export function Footer({ steps, index, mode, go, prev, next }: { steps: readonly StepMeta[]; index: number; mode: Mode; go: (i: number) => void; prev: () => void; next: () => void }) {
  const step = steps[index]
  return <footer data-presentation-footer="" style={{ position: 'absolute', bottom: 54, left: 24, right: 24 }}>
    <h1 data-presentation-title="" style={mode === 'present' ? { whiteSpace: 'nowrap' } : undefined}>{step.title}</h1>
    {mode === 'browse' && <><p data-presentation-caption="">{step.caption}</p>
      <nav data-presentation-navigation="" aria-label="Steps">
        <button data-presentation-prev="" disabled={index === 0} onClick={prev}>← Previous</button>
        <span data-presentation-progress="">{steps.map((s, i) => <button key={s.id} aria-label={`Step ${i + 1}: ${s.title}`} aria-current={i === index ? 'step' : undefined} data-presentation-progress-entry="" data-presentation-active={i === index} onClick={() => go(i)}>{i + 1}</button>)}</span>
        <button data-presentation-next="" disabled={index === steps.length - 1} onClick={next}>Next →</button>
      </nav>
    </>}
  </footer>
}
