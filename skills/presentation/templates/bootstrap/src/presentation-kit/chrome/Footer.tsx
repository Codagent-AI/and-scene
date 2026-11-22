import type { StepMeta } from '../types'
export function Footer({ steps, index, next, prev, jump }: { steps: readonly StepMeta[]; index: number; next: () => void; prev: () => void; jump: (index: number) => void }) {
  return <footer data-presentation-footer="" style={{ position: 'absolute', bottom: 36, left: 0, right: 0 }}>
    <p data-presentation-caption="">{steps[index].caption}</p>
    <nav aria-label="Steps" data-presentation-controls="">
      <button data-presentation-prev="" disabled={index === 0} onClick={prev}>Previous</button>
      <div data-presentation-progress-list="">{steps.map((step, position) => <button key={step.id} data-presentation-progress="" data-active={position === index ? 'true' : 'false'} aria-current={position === index ? 'step' : undefined} aria-label={`Step ${position + 1}: ${step.title}`} onClick={() => jump(position)}>{position + 1}</button>)}</div>
      <button data-presentation-next="" disabled={index === steps.length - 1} onClick={next}>Next</button>
    </nav>
  </footer>
}
