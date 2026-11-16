import type { Mode, StepMeta } from '../types'
export function Footer({ steps, index, mode, jump, prev, next }: { steps: readonly StepMeta[]; index: number; mode: Mode; jump: (n: number) => void; prev: () => void; next: () => void }) {
  return <footer data-presentation-footer="" style={{ position: 'absolute', bottom: 44, left: 0, right: 0 }}>
    {mode === 'present' ? <h1 data-presentation-title="">{steps[index].title}</h1> : <>
      <p data-presentation-caption="">{steps[index].caption}</p>
      <nav aria-label="Steps" data-presentation-progress="">
        {steps.map((s, i) => <button key={s.id} aria-label={`Step ${i + 1}: ${s.title}`} aria-current={i === index ? 'step' : undefined} data-presentation-active={i === index ? 'true' : 'false'} onClick={() => jump(i)}>{i + 1}</button>)}
      </nav>
      <div data-presentation-navigation=""><button onClick={prev} disabled={index === 0}>← Previous</button><button onClick={next} disabled={index === steps.length - 1}>Next →</button></div>
    </>}
  </footer>
}
