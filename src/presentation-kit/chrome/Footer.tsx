import type { Mode, StepMeta } from '../types'
export function Footer({ steps, index, mode, jump, next, prev }: { steps: readonly StepMeta[]; index: number; mode: Mode; jump: (n: number) => void; next: () => void; prev: () => void }) {
  return <footer data-presentation-footer="">
    {mode === 'present' ? <h1 data-presentation-title="">{steps[index].title}</h1> : <>
      <p data-presentation-caption="">{steps[index].caption}</p>
      <nav aria-label="Steps" data-presentation-navigation="">
        <button aria-label="Previous step" onClick={prev} disabled={index === 0}>←</button>
        <div data-presentation-progress="">{steps.map((step, n) => <button key={step.id} aria-label={`Step ${n + 1}: ${step.title}`} aria-current={n === index ? 'step' : undefined} data-presentation-active={n === index ? 'true' : 'false'} onClick={() => jump(n)}>{n + 1}</button>)}</div>
        <button aria-label="Next step" onClick={next} disabled={index === steps.length - 1}>→</button>
      </nav>
    </>}
  </footer>
}
