import type { Mode, StepMeta } from '../types'
export function Footer({ steps, index, mode, next, prev, jump }: { steps: readonly StepMeta[]; index: number; mode: Mode; next: () => void; prev: () => void; jump: (index: number) => void }) {
  return <footer data-presentation-footer="" style={{ position: 'absolute', bottom: 44, left: 24, right: 24 }}>
    {mode === 'present' ? <div data-presentation-title="" style={{ whiteSpace: 'nowrap' }}>{steps[index].title}</div> : <>
      <p data-presentation-caption="">{steps[index].caption}</p>
      <nav aria-label="Steps" data-presentation-navigation="">
        <button data-presentation-prev="" onClick={prev} disabled={index === 0} aria-label="Previous step">Previous</button>
        <div data-presentation-progress="">{steps.map((step, i) => <button key={step.id} aria-label={`Step ${i + 1}: ${step.title}`} aria-current={index === i ? 'step' : undefined} data-presentation-progress-entry="" data-presentation-active={index === i ? 'true' : 'false'} onClick={() => jump(i)}>{i + 1}</button>)}</div>
        <button data-presentation-next="" onClick={next} disabled={index === steps.length - 1} aria-label="Next step">Next</button>
      </nav>
    </>}
  </footer>
}
