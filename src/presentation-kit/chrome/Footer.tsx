import type { Mode, StepMeta } from '../types'
export function Footer({ steps, index, mode, jump, prev, next }: { steps: readonly StepMeta[]; index: number; mode: Mode; jump: (n: number) => void; prev: () => void; next: () => void }) {
  return <footer data-presentation-footer="">
    {mode === 'browse' ? <>
      <p data-presentation-caption="">{steps[index].caption}</p>
      <nav data-presentation-progress="" aria-label="Steps">
        {steps.map((step, i) => <button key={step.id} data-presentation-progress-item="" data-presentation-active={i === index ? 'true' : 'false'} aria-current={i === index ? 'step' : undefined} aria-label={`Step ${i + 1}: ${step.title}`} onClick={() => jump(i)}>{i + 1}</button>)}
      </nav>
      <div data-presentation-navigation=""><button onClick={prev} disabled={index === 0}>Previous</button><button onClick={next} disabled={index === steps.length - 1}>Next</button></div>
    </> : <h1 data-presentation-title="">{steps[index].title}</h1>}
  </footer>
}
