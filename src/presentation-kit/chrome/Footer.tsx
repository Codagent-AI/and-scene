import type { Mode, StepMeta } from '../types'
export function Footer({ steps, index, mode, jump, next, prev }: { steps: StepMeta[]; index: number; mode: Mode; jump: (i: number) => void; next: () => void; prev: () => void }) {
  return <footer data-presentation-footer="">
    <h1 data-presentation-step-title="">{steps[index].title}</h1>
    {mode === 'browse' && <>
      <p data-presentation-caption="">{steps[index].caption}</p>
      <nav data-presentation-navigation="" aria-label="Presentation steps">
        <button data-presentation-prev="" disabled={index === 0} onClick={prev}>Previous</button>
        <div data-presentation-progress="">{steps.map((step, i) => <button key={step.id} aria-label={`Step ${i + 1}: ${step.title}`} aria-current={i === index ? 'step' : undefined} data-presentation-progress-step="" data-presentation-active={i === index ? 'true' : 'false'} onClick={() => jump(i)}>{i + 1}</button>)}</div>
        <button data-presentation-next="" disabled={index === steps.length - 1} onClick={next}>Next</button>
      </nav>
    </>}
  </footer>
}
