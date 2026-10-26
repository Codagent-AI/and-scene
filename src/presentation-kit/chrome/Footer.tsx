import type { Mode, StepMeta } from '../types'
export function Footer({ steps, index, mode, go, next, prev }: { steps: readonly StepMeta[]; index: number; mode: Mode; go: (i: number) => void; next: () => void; prev: () => void }) {
  const step = steps[index]
  return <footer data-presentation-footer="">{mode === 'present' ? <h1 data-presentation-title="">{step.title}</h1> : <><p data-presentation-caption="">{step.caption}</p><nav aria-label="Steps" data-presentation-progress=""><button data-presentation-prev="" disabled={index === 0} onClick={prev}>Previous</button>{steps.map((s, i) => <button key={s.id} data-presentation-progress-step="" data-presentation-active={i === index ? 'true' : 'false'} aria-current={i === index ? 'step' : undefined} aria-label={`Step ${i + 1}: ${s.title}`} onClick={() => go(i)}>{i + 1}</button>)}<button data-presentation-next="" disabled={index === steps.length - 1} onClick={next}>Next</button></nav></>}</footer>
}
