import type { StepMeta } from '../types'
export function Footer({ steps, index, jump, next, prev }: { steps: StepMeta[]; index: number; jump: (index: number) => void; next: () => void; prev: () => void }) {
  return <footer data-presentation-footer="" style={{ position: 'absolute', bottom: 30, left: 0, right: 0 }}>
    <h2 data-presentation-step-title="">{steps[index].title}</h2>
    <p data-presentation-caption="">{steps[index].caption}</p>
    <nav data-presentation-progress="" aria-label="Steps">{steps.map((step, i) => <button key={step.id} data-presentation-active={i === index} aria-current={i === index ? 'step' : undefined} aria-label={`Step ${i + 1}: ${step.title}`} onClick={() => jump(i)}>{i + 1}</button>)}</nav>
    <button aria-label="Previous step" onClick={prev} disabled={index === 0}>Previous</button>
    <button aria-label="Next step" onClick={next} disabled={index === steps.length - 1}>Next</button>
  </footer>
}
