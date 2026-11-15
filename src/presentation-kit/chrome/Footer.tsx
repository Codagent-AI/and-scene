import type { Mode, StepMeta } from '../types'
export function Footer({ steps, index, mode, go, prev, next }: { steps: readonly StepMeta[]; index: number; mode: Mode; go: (i: number) => void; prev: () => void; next: () => void }) {
  return <footer data-presentation-footer="">
    {mode === 'present' ? <h1 data-presentation-title="">{steps[index].title}</h1> : <>
      <p data-presentation-caption="">{steps[index].caption}</p>
      <nav aria-label="Steps" data-presentation-navigation="">
        <button data-presentation-prev="" disabled={index === 0} onClick={prev} aria-label="Previous step">←</button>
        <div data-presentation-progress="">{steps.map((s, i) => <button key={s.id} data-presentation-progress-entry="" data-presentation-active={i === index ? 'true' : 'false'} aria-current={i === index ? 'step' : undefined} aria-label={`Step ${i + 1}: ${s.title}`} onClick={() => go(i)}>{i + 1}</button>)}</div>
        <button data-presentation-next="" disabled={index === steps.length - 1} onClick={next} aria-label="Next step">→</button>
      </nav>
    </>}
  </footer>
}
