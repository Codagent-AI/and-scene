import type { Mode, StepMeta } from '../types'
export function Footer({ steps, index, mode, prev, next, goTo }: { steps: readonly StepMeta[]; index: number; mode: Mode; prev: () => void; next: () => void; goTo: (index: number) => void }) {
  const step = steps[index]
  return <footer data-presentation-footer="" style={{ position: 'absolute', bottom: 48, left: '50%', transform: 'translateX(-50%)', width: 'min(740px, calc(100% - 48px))' }}>
    <h1 data-presentation-step-title="">{step.title}</h1>
    {mode === 'browse' && <>
      <p data-presentation-caption="">{step.caption}</p>
      <nav data-presentation-navigation="" aria-label="Steps">
        <button data-presentation-prev="" onClick={prev} disabled={index === 0} aria-label="Previous step">←</button>
        {steps.map((item, i) => <button key={item.id} data-presentation-progress="" data-presentation-active={i === index ? 'true' : 'false'} aria-current={i === index ? 'step' : undefined} aria-label={`Step ${i + 1}: ${item.title}`} onClick={() => goTo(i)}>{i + 1}</button>)}
        <button data-presentation-next="" onClick={next} disabled={index === steps.length - 1} aria-label="Next step">→</button>
      </nav>
    </>}
  </footer>
}
