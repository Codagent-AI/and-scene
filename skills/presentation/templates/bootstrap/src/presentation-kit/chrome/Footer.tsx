import type { Mode, StepMeta } from '../types'
export function Footer({ steps, index, mode, go, next, prev }: { steps: readonly StepMeta[]; index: number; mode: Mode; go: (n: number) => void; next: () => void; prev: () => void }) {
  return <footer data-presentation-footer="" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
    {mode === 'present' ? <h1 data-presentation-title="">{steps[index].title}</h1> : <>
      <p data-presentation-caption="">{steps[index].caption}</p>
      <nav aria-label="Steps" data-presentation-progress="">
        <button onClick={prev} disabled={index === 0} aria-label="Previous step">←</button>
        {steps.map((step, i) => <button key={step.id} data-presentation-progress-step={i} data-presentation-active={i === index ? 'true' : 'false'} aria-current={i === index ? 'step' : undefined} aria-label={`Step ${i + 1}: ${step.title}`} onClick={() => go(i)}>{i + 1}</button>)}
        <button onClick={next} disabled={index === steps.length - 1} aria-label="Next step">→</button>
      </nav>
    </>}
    <a data-presentation-attribution="" href="https://github.com/Codagent-AI/and-scene" style={{ position: 'absolute', right: 0, bottom: 0 }}>made by and-scene</a>
  </footer>
}
