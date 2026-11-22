import type { Mode, StepMeta } from '../types'

export function Footer({ steps, index, mode, next, prev, jump }: { steps: readonly StepMeta[], index: number, mode: Mode, next: () => void, prev: () => void, jump: (index: number) => void }) {
  const step = steps[index]
  return <footer data-presentation-footer="" style={{ position: 'absolute', bottom: 40, left: 0, right: 0 }}>
    {mode === 'present' ? <h1 data-presentation-title="" style={{ whiteSpace: 'nowrap' }}>{step.title}</h1> : <>
      <p data-presentation-caption="">{step.caption}</p>
      <nav data-presentation-navigation="" aria-label="Step navigation">
        <button type="button" data-presentation-prev="" onClick={prev} disabled={index === 0} aria-label="Previous step">Previous</button>
        <div data-presentation-progress="" role="group" aria-label="Choose a step">
          {steps.map((entry, i) => <button key={entry.id} type="button" aria-label={`Step ${i + 1}: ${entry.title}`} aria-current={i === index ? 'step' : undefined} data-presentation-active={i === index} onClick={() => jump(i)}>{i + 1}</button>)}
        </div>
        <button type="button" data-presentation-next="" onClick={next} disabled={index === steps.length - 1} aria-label="Next step">Next</button>
      </nav>
    </>}
  </footer>
}
