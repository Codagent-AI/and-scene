import type { Mode, StepMeta } from '../types'
export function Footer({ steps, index, mode, prev, next, jump }: { steps: readonly StepMeta[]; index: number; mode: Mode; prev: () => void; next: () => void; jump: (index: number) => void }) {
  return <footer data-presentation-footer="" style={{ position: 'absolute', left: 24, right: 24, bottom: 48 }}>
    {mode === 'browse' ? <>
      <p data-presentation-caption="">{steps[index].caption}</p>
      <nav data-presentation-navigation="" aria-label="Presentation steps">
        <button data-presentation-prev="" onClick={prev} disabled={index === 0} aria-label="Previous step">← Previous</button>
        <div data-presentation-progress="">
          {steps.map((step, i) => <button key={step.id} data-presentation-progress-step="" data-presentation-active={i === index ? 'true' : 'false'} aria-current={i === index ? 'step' : undefined} aria-label={`Step ${i + 1}: ${step.title}`} onClick={() => jump(i)}>{i + 1}</button>)}
        </div>
        <button data-presentation-next="" onClick={next} disabled={index === steps.length - 1} aria-label="Next step">Next →</button>
      </nav>
    </> : <h1 data-presentation-title="" style={{ whiteSpace: 'nowrap' }}>{steps[index].title}</h1>}
  </footer>
}
