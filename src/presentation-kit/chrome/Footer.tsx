import type { Mode, StepMeta } from '../types'
export function Footer({ steps, index, mode, jump, next, prev }: { steps: readonly StepMeta[]; index: number; mode: Mode; jump: (index: number) => void; next: () => void; prev: () => void }) {
  return <footer data-presentation-footer="" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
    {mode === 'browse' ? <>
      <p data-presentation-caption="">{steps[index].caption}</p>
      <nav data-presentation-progress="" aria-label="Steps">{steps.map((step, i) => <button key={step.id} aria-label={`Step ${i + 1}: ${step.title}`} aria-current={i === index ? 'step' : undefined} data-presentation-active={i === index ? 'true' : 'false'} onClick={() => jump(i)}>{i + 1}</button>)}</nav>
      <div data-presentation-controls=""><button disabled={index === 0} onClick={prev}>Previous</button><button disabled={index === steps.length - 1} onClick={next}>Next</button></div>
    </> : <h1 data-presentation-title="">{steps[index].title}</h1>}
  </footer>
}
